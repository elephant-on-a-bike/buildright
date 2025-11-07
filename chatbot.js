// Updated chatbot.js with working help button and modal
let questions = [];
let answers = {};
let keywordMap = {};
let questionHistory = [];
// Track where answers came from: 'keyword' (inferred), 'user' (explicit), etc.
let inferredSources = {};

document.getElementById('start-btn').addEventListener('click', startChat);

async function startChat() {
  document.getElementById('start-btn').style.display = 'none';
  document.getElementById('loader').style.display = 'block';

  const [questionsRes, keywordsRes] = await Promise.all([
    fetch('questions.json'),
    fetch('keywords.json')
  ]);

  // Parse questions and keywords. Also capture raw keywords text for diagnostics.
  questions = await questionsRes.json();

  // Read raw text preview before parsing JSON for debugging (clone response first)
  let keywordsRaw = '';
  try {
    keywordsRaw = await keywordsRes.clone().text();
  } catch (e) {
    console.warn('Could not read keywords raw text:', e);
  }

  try {
    keywordMap = await keywordsRes.json();
  } catch (e) {
    console.error('Failed to parse keywords.json as JSON — falling back to raw inspect', e);
    // expose raw text in console for investigation
    console.log('keywords.json raw preview:', keywordsRaw.slice(0, 2000));
    keywordMap = {};
  }

  // Diagnostic logs: show how many keys were loaded and a small preview.
  try {
    const keys = Object.keys(keywordMap || {});
    console.log('keywords loaded — count:', keys.length, 'first keys:', keys.slice(0,50));
    console.log('keywords.json raw length:', keywordsRaw.length, 'raw preview:', keywordsRaw.slice(0,500));
    // If the loaded map looks unexpectedly small, try a cache-busting re-fetch to bypass any stale caching.
    if (keys.length < 20) {
      console.warn('keywords.json appears small (count < 20). Attempting cache-bust re-fetch...');
      try {
        const res2 = await fetch('keywords.json?cb=' + Date.now());
        const raw2 = await res2.text();
        let parsed2 = {};
        try { parsed2 = JSON.parse(raw2); } catch (e) { console.error('Cache-bust fetch returned invalid JSON', e); }
        const keys2 = Object.keys(parsed2 || {});
        console.log('cache-bust load — count:', keys2.length, 'first keys:', keys2.slice(0,50));
        // If cache-bust returned more keys, replace keywordMap
        if (keys2.length > keys.length) {
          keywordMap = parsed2;
          console.log('keywordMap replaced with cache-bust version.');
        }
      } catch (e) {
        console.warn('Cache-bust fetch failed', e);
      }
    }
  } catch (e) {
    console.warn('Error while logging keywordMap diagnostics', e);
  }

  document.getElementById('loader').style.display = 'none';

  // Reveal the chat container and UI now that the chat is starting
  // This keeps the initial page clean: only the centered Begin button shows.
  document.body.classList.add('chat-active');

  askIntro();
}

function askIntro() {
  const container = document.getElementById('chat-container');
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'chat-question';
  wrapper.innerHTML = `
    <p>Tell us a bit about your project.</p>
    <p class="chat-subtext">This helps us understand your needs and guide you through the right questions to define your renovation or fit-out scope.</p>
  `;

  const textarea = document.createElement('textarea');
  textarea.placeholder = "e.g. Renovating my bathroom, need new tiles and plumbing fixes.";
  wrapper.appendChild(textarea);

  // Debug: show matched keywords and highlighted narrative here
  // Create a persistent debug area outside the per-question container so it
  // isn't removed when the chat UI clears question content.
  let matchedDiv = document.getElementById('matched-keywords');
  if (!matchedDiv) {
    matchedDiv = document.createElement('div');
    matchedDiv.id = 'matched-keywords';
    matchedDiv.className = 'matched-keywords';
    // append to the container's parent so it persists across question renders
    if (container && container.parentElement) container.parentElement.appendChild(matchedDiv);
    else container.appendChild(matchedDiv);
  }

  const btn = document.createElement('button');
  btn.textContent = "Continue";
  btn.className = "btn btn-primary";
  btn.addEventListener('click', () => {
    const text = textarea.value.trim();
    if (text) {
      extractKeywords(text);
      showNextQuestion();
    }
  });

  wrapper.appendChild(btn);
  container.appendChild(wrapper);
  textarea.focus();
}

function extractKeywords(text) {
  // Improved keyword matching:
  // - match longest keywords first to avoid partial matches
  // - use word-boundary regex to avoid matching inside other words
  // Normalize text: lowercase and strip punctuation so keywords like
  // "electrical" and "lighting" match reliably even when adjacent to punctuation.
  const normalized = String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // Build entries with trimmed keys to avoid invisible whitespace issues.
  // Support comma-separated keys (e.g. "house,flat,apartment") as shorthand
  // where multiple synonyms map to the same prefill object. Each token is
  // expanded into its own matching entry but we keep `baseKey` to reference
  // the original mapping for debugging and rendering.
  const entries = [];
  const tokenToBase = Object.create(null);
  for (const [baseKey, v] of Object.entries(keywordMap || {})) {
    // allow comma-separated tokens in the key, or a single token
    const parts = String(baseKey).split(',').map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      const keyTrim = part;
      entries.push({ baseKey, keyTrim, value: v });
      tokenToBase[keyTrim] = baseKey;
    }
  }
  // sort longest-first so multi-word keys match before their substrings.
  entries.sort((a, b) => b.keyTrim.length - a.keyTrim.length);
  const matched = [];

  // Primary pass: word-boundary regex against normalized text
  const detailed = [];
  for (const entry of entries) {
    const kw = entry.keyTrim;
    if (!kw) continue;
    const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('\\b' + esc + '\\b', 'i');
    try {
      const ok = re.test(normalized);
      detailed.push({ kw, method: 'regex', matched: !!ok });
      if (ok) {
        matched.push(kw);
        const prefill = entry.value;
        for (const key in prefill) {
          if (answers[key] === undefined) {
            answers[key] = prefill[key];
            // record inferred source
            inferredSources[key] = { source: 'keyword', keyword: kw, method: 'regex' };
          }
        }
      }
    } catch (e) {
      // ignore regex issues for this keyword
    }
  }

  // Secondary fallback: for single-word keywords not matched above,
  // perform a simple substring check on normalized text (helps for plural/stem issues)
  const unmatchedSingle = entries.filter(e => !matched.includes(e.keyTrim) && e.keyTrim.indexOf(' ') === -1);
  for (const e of unmatchedSingle) {
    const kw = e.keyTrim;
    const ok = normalized.includes(kw.toLowerCase());
    detailed.push({ kw, method: 'substr', matched: !!ok });
    if (ok) {
      matched.push(kw);
      const prefill = e.value;
      for (const key in prefill) {
        if (answers[key] === undefined) {
          answers[key] = prefill[key];
          inferredSources[key] = { source: 'keyword', keyword: kw, method: 'substr' };
        }
      }
    }
  }

  // Tertiary loose pass: check any remaining keys with a relaxed substring test
  // (helps if normalized tokenization trimmed punctuation differently).
  const remaining = entries.filter(e => !matched.includes(e.keyTrim));
  for (const e of remaining) {
    const kw = e.keyTrim;
    const low = kw.toLowerCase();
    const ok = normalized.includes(low) || String(text).toLowerCase().includes(low);
    detailed.push({ kw, method: 'loose', matched: !!ok });
    if (ok) {
      matched.push(kw);
      const prefill = e.value;
      for (const key in prefill) {
        if (answers[key] === undefined) {
          answers[key] = prefill[key];
          inferredSources[key] = { source: 'keyword', keyword: kw, method: 'loose' };
        }
      }
    }
  }

  // Fuzzy/autocorrect pass: check tokens against remaining keys using Levenshtein
  try {
    const remainingForFuzzy = entries.filter(e => !matched.includes(e.keyTrim));
    const tokens = normalized.split(' ').filter(Boolean);
    for (const token of tokens) {
      if (token.length < 4) continue; // avoid short words
      let best = { entry: null, dist: Infinity };
      for (const e of remainingForFuzzy) {
        const kw = e.keyTrim.toLowerCase();
        const d = levenshtein(token, kw);
        if (d < best.dist) best = { entry: e, dist: d };
      }
      if (best.entry) {
        const threshold = (token.length >= 8) ? 2 : 1; // allow distance 2 for longer words
        if (best.dist <= threshold) {
          const kw = best.entry.keyTrim;
          detailed.push({ kw, method: 'fuzzy', matched: true, dist: best.dist });
          if (!matched.includes(kw)) {
            matched.push(kw);
            const prefill = best.entry.value;
            for (const key in prefill) {
              if (answers[key] === undefined) {
                answers[key] = prefill[key];
                inferredSources[key] = { source: 'keyword', keyword: kw, method: 'fuzzy', dist: best.dist };
              }
            }
          }
        } else {
          detailed.push({ kw: best.entry.keyTrim, method: 'fuzzy', matched: false, dist: best.dist });
        }
      }
    }
  } catch (e) {
    // defensive: if fuzzy pass fails, ignore and continue
    console.warn('fuzzy match failed', e);
  }
  answers["project_description"] = text;
  inferredSources["project_description"] = { source: 'user' };
  // Debug: also log detailed matching to the console for quick inspection
  try {
    console.log('keyword-match-debug', { text, normalized, matched, detailed, answers });
  } catch (e) {}

  // also pass a snapshot of available keys for debugging plus the token->base map
  const keysSnapshot = entries.map(e => e.keyTrim).slice(0, 200);
  renderMatchedKeywords(text, matched, normalized, detailed, keysSnapshot, tokenToBase);
}

function renderMatchedKeywords(text, matched, normalized, detailed, keysSnapshot, tokenToBase) {
  const div = document.getElementById('matched-keywords');
  if (!div) return;
  // show original text with matched words highlighted (longest-first replace)
  let out = text;
  const unique = Array.from(new Set(matched)).sort((a,b)=>b.length - a.length);
  for (const kw of unique) {
    if (!kw) continue;
    const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('\\b' + esc + '\\b', 'ig');
    out = out.replace(re, match => `<mark class="kw">${match}</mark>`);
  }

  const list = unique.length ? ('<ul>' + unique.map(k => {
    const base = (tokenToBase && tokenToBase[k]) ? tokenToBase[k] : k;
    return `<li><strong>${escapeHtml(k)}</strong> → ${escapeHtml(JSON.stringify(keywordMap[base]))}</li>`;
  }).join('') + '</ul>') : '<div class="muted">No keywords detected</div>';

  // show normalized input and detailed per-keyword checks for debugging
  const normHtml = `<div class="muted">Normalized: <code>${escapeHtml(normalized || '')}</code></div>`;
  const detailedHtml = '<details class="match-details"><summary>Match details</summary><ul>' +
    detailed.map(d => `<li>${escapeHtml(d.kw)} — ${d.method} — ${d.matched ? '<strong>matched</strong>' : 'no'}</li>`).join('') +
    '</ul></details>';

  const keysHtml = '<details class="keys-snapshot"><summary>Keywords loaded (' + (keysSnapshot ? keysSnapshot.length : 0) + ')</summary><div class="ks-list">' +
    (keysSnapshot ? escapeHtml(keysSnapshot.join(', ')) : '') + '</div></details>';

  div.innerHTML = `${normHtml}${keysHtml}<div class="matched-text">${escapeHtml(out)}</div><div class="matched-list">${list}</div>${detailedHtml}`;
  // we replaced with HTML inside out, so fix: allow the highlighted html
  // replace escaped marks back to real HTML (cheap but fine for debug)
  div.querySelector('.matched-text').innerHTML = out;

  // Also render the live answers object for debugging
  const answersPre = document.createElement('pre');
  answersPre.className = 'answers-dump';
  try { answersPre.textContent = JSON.stringify(answers, null, 2); } catch (e) { answersPre.textContent = String(answers); }
  // remove existing if present
  const old = div.querySelector('.answers-dump');
  if (old) old.remove();
  div.appendChild(answersPre);
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Compact Levenshtein distance (iterative DP) for small strings — used for fuzzy matching
function levenshtein(a, b) {
  a = String(a || ''); b = String(b || '');
  const al = a.length, bl = b.length;
  if (al === 0) return bl; if (bl === 0) return al;
  const v0 = new Array(bl + 1);
  const v1 = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) v0[j] = j;
  for (let i = 0; i < al; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < bl; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= bl; j++) v0[j] = v1[j];
  }
  return v1[bl];
}

function showNextQuestion() {
  const container = document.getElementById('chat-container');
  container.innerHTML = '';
  document.getElementById('loader').style.display = 'block';

  setTimeout(() => {
    document.getElementById('loader').style.display = 'none';

    const next = questions.find(q => answers[q.id] === undefined && evaluateConditions(q));
    if (!next) {
      renderSummary(container);
      return;
    }

    questionHistory.push(next.id);

    // hide the matched-keywords debug panel after the second question
    try {
      const mk = document.getElementById('matched-keywords');
      if (mk) {
        if (questionHistory.length >= 2) mk.style.display = 'none';
        else mk.style.display = '';
      }
    } catch (e) {}

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-question';

    const questionRow = document.createElement('div');
    questionRow.className = 'chat-question-row';

    const questionText = document.createElement('p');
    questionText.textContent = next.question;
    questionRow.appendChild(questionText);

    if (next.help) {
      const helpBtn = document.createElement('button');
      helpBtn.className = 'help-icon';
      helpBtn.setAttribute('aria-label', 'More info');

      // Use a path-based SVG for maximum compatibility across browsers.
      // Also include a textual fallback inside a visually shown span in case
      // SVG rendering is blocked by global rules.
      helpBtn.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path fill="#374151" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.88 15.5h-1.75v-1.75h1.75V17.5zM15.07 10.59c-.37.77-1.02 1.23-1.78 1.72-.39.25-.63.43-.63.97v.27H11.6v-.39c0-.95.38-1.29.86-1.6.62-.42 1.41-.96 1.63-1.7.18-.57-.06-1.11-.57-1.36-.48-.23-1.08-.1-1.41.3l-.99-1.06c.64-.82 1.66-1.2 2.68-1.12 1.48.12 2.44 1.5 2.01 2.95z"/>
        </svg>
        <span class="help-fallback" aria-hidden="true">?</span>
      `;

      helpBtn.addEventListener('click', () => showHelpModal(next.question, next.help));
      questionRow.appendChild(helpBtn);

      // Runtime SVG visibility detection: some global CSS or browser quirks
      // can cause inline SVGs to render with zero width. Detect that and
      // show the textual fallback by adding `.no-svg` which our CSS handles.
      const svgEl = helpBtn.querySelector('svg');
      requestAnimationFrame(() => {
        try {
          if (svgEl) {
            const w = svgEl.getBoundingClientRect().width;
            if (!w || w < 2) {
              // mark the button to show the fallback text
              helpBtn.classList.add('no-svg');
              // also try an inline style override as a best-effort fix
              svgEl.style.width = '16px';
              svgEl.style.height = '16px';
              svgEl.style.maxWidth = 'none';
            }
          }
        } catch (e) {
          // defensive - if measurement fails, show fallback
          helpBtn.classList.add('no-svg');
        }
      });
    }

    wrapper.appendChild(questionRow);

    // Subtly surface why this question is being asked (narrative or previous answer)
    try {
      const trigger = detectTriggerSource(next);
      if (trigger) {
        const hint = document.createElement('div');
        hint.className = 'trigger-hint';
        if (trigger.source === 'narrative') {
          const ev = (trigger.evidence && trigger.evidence[0]) ? trigger.evidence[0] : '';
          hint.textContent = ev ? `Asked because you mentioned "${ev}"` : 'Asked based on your project description.';
        } else if (trigger.source === 'previous') {
          hint.textContent = 'Follow‑up based on your earlier answer.';
        }
        questionRow.appendChild(hint);
      }
    } catch (e) {
      // defensive: don't block question rendering on hint errors
      console.warn('trigger hint render failed', e);
    }

    if (next.type === 'select') {
      next.options.forEach(option => {
        const btn = document.createElement('button');
        btn.textContent = option;
        btn.className = 'btn btn-secondary';
        btn.addEventListener('click', () => {
          answers[next.id] = option;
          // mark this answer as provided by the user explicitly
          inferredSources[next.id] = { source: 'user' };
          showNextQuestion();
        });
        wrapper.appendChild(btn);
      });
    } else {
      let input;
      if (next.type === 'textarea') {
        input = document.createElement('textarea');
      } else {
        input = document.createElement('input');
        input.type = next.type;
      }
      input.className = 'chat-input';
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (input.value.trim()) {
            answers[next.id] = input.value.trim();
            // mark as user-provided
            inferredSources[next.id] = { source: 'user' };
            showNextQuestion();
          }
        }
      });
      wrapper.appendChild(input);
      input.focus();
    }

    container.appendChild(wrapper);

    if (questionHistory.length > 1) {
      const backWrapper = document.createElement('div');
      backWrapper.className = 'chat-back';

      const backBtn = document.createElement('button');
      backBtn.setAttribute('aria-label', 'Go back');
      backBtn.innerHTML = `
        <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.707 15.707a1 1 0 01-1.414 0L6.586 11l4.707-4.707a1 1 0 00-1.414-1.414l-5.414 5.414a1 1 0 000 1.414l5.414 5.414a1 1 0 001.414-1.414z"/>
        </svg>
      `;
      backBtn.addEventListener('click', () => {
        const lastId = questionHistory.pop();
        delete answers[lastId];
        // remove any inferred source so re-asking will be clean
        if (inferredSources && inferredSources[lastId]) delete inferredSources[lastId];
        showNextQuestion();
      });

      backWrapper.appendChild(backBtn);
      container.appendChild(backWrapper);
    }
  }, 600);
}

function evaluateConditions(question) {
  // Support multiple condition formats for backwards compatibility:
  // 1) Simple object format (legacy) used in `questions.json`: { all: [...], any: [...] }
  //    where entries are { id, value }
  // 2) Advanced format (from logic.js):
  //    - question.conditions: [ { depends_on, value } ]  => treated as AND
  //    - question.conditionGroups: [ [ { depends_on, value }, ... ], ... ] => OR of AND groups
  // If no conditions present, show by default.
  if (!question) return true;

  // 1) Advanced: explicit array of conditions (AND semantics)
  if (Array.isArray(question.conditions)) {
    return question.conditions.every(cond => {
      const key = cond.depends_on || cond.id || cond.name;
      const actual = answers[key];
      if (Array.isArray(cond.value)) {
        return cond.value.some(v => String(actual).toLowerCase() === String(v).toLowerCase());
      }
      return String(actual).toLowerCase() === String(cond.value).toLowerCase();
    });
  }

  // 2) Advanced: conditionGroups => OR of groups (each group is an array of conds, AND semantics)
  if (Array.isArray(question.conditionGroups) && question.conditionGroups.length > 0) {
    return question.conditionGroups.some(group =>
      Array.isArray(group) && group.every(cond => {
        const key = cond.depends_on || cond.id || cond.name;
        const actual = answers[key];
        if (Array.isArray(cond.value)) {
          return cond.value.some(v => String(actual).toLowerCase() === String(v).toLowerCase());
        }
        return String(actual).toLowerCase() === String(cond.value).toLowerCase();
      })
    );
  }

  // 3) Legacy simple object format: { all: [...], any: [...] }
  if (question.conditions && typeof question.conditions === 'object') {
    const { all, any } = question.conditions;
    if (Array.isArray(all) && all.length > 0) {
      return all.every(cond => {
        const actual = answers[cond.id];
        if (Array.isArray(cond.value)) {
          return cond.value.some(v => String(actual).toLowerCase() === String(v).toLowerCase());
        }
        return String(actual).toLowerCase() === String(cond.value).toLowerCase();
      });
    }
    if (Array.isArray(any) && any.length > 0) {
      return any.some(cond => {
        const actual = answers[cond.id];
        if (Array.isArray(cond.value)) {
          return cond.value.some(v => String(actual).toLowerCase() === String(v).toLowerCase());
        }
        return String(actual).toLowerCase() === String(cond.value).toLowerCase();
      });
    }
  }

  // No conditions found — default to visible
  return true;
}

/**
 * Detect whether a question is being asked because of narrative keywords
 * or as a follow-up to a previous answer. Returns an object { source, evidence }
 * where source is 'narrative'|'previous' or null.
 */
function detectTriggerSource(question) {
  if (!question) return null;

  function inspectCond(cond) {
    const key = cond.depends_on || cond.id || cond.name;
    if (!key) return null;
    if (answers[key] !== undefined) {
      const info = inferredSources[key] || { source: 'user' };
      return { key, source: info.source, info };
    }
    return null;
  }

  // Advanced: conditions array (AND)
  if (Array.isArray(question.conditions)) {
    const results = question.conditions.map(inspectCond).filter(Boolean);
    if (results.length === question.conditions.length && results.length > 0) {
      if (results.some(r => r.source === 'keyword')) return { source: 'narrative', evidence: results.filter(r=>r.source==='keyword').map(r=>r.info && r.info.keyword || r.key) };
      return { source: 'previous', evidence: results.map(r=>r.key) };
    }
  }

  // Advanced: conditionGroups (OR of AND groups)
  if (Array.isArray(question.conditionGroups) && question.conditionGroups.length) {
    for (const group of question.conditionGroups) {
      if (!Array.isArray(group)) continue;
      const results = group.map(inspectCond).filter(Boolean);
      if (results.length === group.length && results.length > 0) {
        if (results.some(r => r.source === 'keyword')) return { source: 'narrative', evidence: results.filter(r=>r.source==='keyword').map(r=>r.info && r.info.keyword || r.key) };
        return { source: 'previous', evidence: results.map(r=>r.key) };
      }
    }
  }

  // Legacy: { all, any }
  if (question.conditions && typeof question.conditions === 'object') {
    const { all, any } = question.conditions;
    if (Array.isArray(all) && all.length > 0) {
      const results = all.map(cond => {
        const key = cond.id;
        if (answers[key] !== undefined) {
          const info = inferredSources[key] || { source: 'user' };
          return { key, source: info.source, info };
        }
        return null;
      }).filter(Boolean);
      if (results.length === all.length && results.length > 0) {
        if (results.some(r => r.source === 'keyword')) return { source: 'narrative', evidence: results.filter(r=>r.source==='keyword').map(r=>r.info && r.info.keyword || r.key) };
        return { source: 'previous', evidence: results.map(r=>r.key) };
      }
    }
    if (Array.isArray(any) && any.length > 0) {
      const results = any.map(cond => {
        const key = cond.id;
        if (answers[key] !== undefined) {
          const info = inferredSources[key] || { source: 'user' };
          return { key, source: info.source, info };
        }
        return null;
      }).filter(Boolean);
      if (results.length > 0) {
        if (results.some(r => r.source === 'keyword')) return { source: 'narrative', evidence: results.filter(r=>r.source==='keyword').map(r=>r.info && r.info.keyword || r.key) };
        return { source: 'previous', evidence: results.map(r=>r.key) };
      }
    }
  }

  return null;
}

function renderSummary(container) {
  const summary = document.createElement('div');
  summary.className = 'chat-summary';
  summary.innerHTML = `<h2>Project Scope Summary</h2>`;
  const ul = document.createElement('ul');

  for (const [key, value] of Object.entries(answers)) {
    const li = document.createElement('li');
    li.textContent = `${key.replace(/_/g, ' ')}: ${value}`;
    ul.appendChild(li);
  }

  summary.appendChild(ul);
  // add email button to allow client to receive a PDF copy
  const actions = document.createElement('div');
  actions.className = 'chat-summary-actions';

  const emailBtn = document.createElement('button');
  emailBtn.className = 'btn btn-primary';
  emailBtn.textContent = 'Email PDF';
  emailBtn.addEventListener('click', async () => {
    try {
      // show modal to collect recipient email
      const recipient = await showEmailModal();
      if (!recipient) return;

      // ensure html2pdf is available (load dynamically if not)
      if (typeof html2pdf === 'undefined') {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.3/html2pdf.bundle.min.js');
      }

      // generate a printable clone of the summary to ensure styling
      const clone = summary.cloneNode(true);
      clone.style.maxWidth = '800px';
      clone.style.padding = '20px';
      clone.style.background = '#ffffff';

      // create a container for the PDF content off-document
      const pdfContainer = document.createElement('div');
      pdfContainer.style.position = 'fixed';
      pdfContainer.style.left = '-9999px';
      pdfContainer.appendChild(clone);
      document.body.appendChild(pdfContainer);

      // create PDF via html2pdf and get pdf (jsPDF) instance, then extract blob
      const opt = { margin: 10, filename: 'project-scope.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
      const pdf = await html2pdf().from(clone).set(opt).toPdf().get('pdf');
      const blob = pdf.output('blob');

      // cleanup the offscreen container
      pdfContainer.remove();

      // send to server endpoint (PHP) for emailing
      const fd = new FormData();
      fd.append('recipient', recipient);
      fd.append('file', blob, 'project-scope.pdf');

      // show a lightweight in-UI status
      const sending = document.createElement('div');
      sending.className = 'pdf-sending';
      sending.textContent = 'Sending PDF — please wait...';
      summary.appendChild(sending);

      const resp = await fetch('send_pdf.php', { method: 'POST', body: fd });
      sending.remove();
      if (!resp.ok) {
        const txt = await resp.text();
        alert('Failed to send PDF: ' + txt);
        return;
      }
      const j = await resp.json().catch(()=>({ok:false,message:'Invalid JSON response'}));
      if (j && j.ok) {
        alert('PDF sent successfully to ' + recipient + '.');
      } else {
        alert('Failed to send PDF: ' + (j && j.message ? j.message : 'Unknown error'));
      }

    } catch (err) {
      console.error('Failed to generate or send PDF', err);
      alert('Sorry — could not generate/send the PDF. See console for details.');
    }
  });

  actions.appendChild(emailBtn);
  summary.appendChild(actions);
  container.appendChild(summary);
}

// Helper to dynamically load a script and return when it's ready
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = (e) => reject(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });
}

// Show a small modal to collect an email address; returns the email string or null
function showEmailModal() {
  return new Promise((resolve) => {
    // Reuse the modal pattern but with email input and Send/Cancel buttons
    let modal = document.getElementById('email-modal');
    const previousActive = document.activeElement;

    function close(value) {
      if (!modal) return resolve(null);
      document.body.classList.remove('modal-open');
      modal.remove();
      modal = null;
      if (previousActive && previousActive.focus) previousActive.focus();
      resolve(value || null);
    }

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'email-modal';
      modal.className = 'help-modal';
      modal.innerHTML = `
        <div class="help-modal-overlay" tabindex="-1"></div>
        <div class="help-modal-content" role="dialog" aria-modal="true" aria-labelledby="email-title">
          <button class="help-close" aria-label="Close">&times;</button>
          <h3 id="email-title">Send project PDF</h3>
          <div style="margin-top:8px">
            <label for="email-input">Recipient email</label>
            <input id="email-input" type="email" style="width:100%;padding:8px;margin-top:6px;border:1px solid #d1d5db;border-radius:6px" placeholder="client@example.com" />
          </div>
          <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
            <button id="email-cancel" class="btn">Cancel</button>
            <button id="email-send" class="btn btn-primary">Send</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const overlay = modal.querySelector('.help-modal-overlay');
      const closeBtn = modal.querySelector('.help-close');
      const cancelBtn = modal.querySelector('#email-cancel');
      const sendBtn = modal.querySelector('#email-send');
      const input = modal.querySelector('#email-input');

      function onClose() { close(null); }
      function onCancel() { close(null); }
      function onSend() {
        const v = (input.value || '').trim();
        if (!v || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
          input.focus();
          input.style.borderColor = 'red';
          return;
        }
        close(v);
      }

      overlay.addEventListener('click', onClose);
      closeBtn.addEventListener('click', onCancel);
      cancelBtn.addEventListener('click', onCancel);
      sendBtn.addEventListener('click', onSend);

      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'Enter') onSend();
      });

      document.body.classList.add('modal-open');
      input.focus();
    }
  });
}

function showHelpModal(title, content) {
  // Create (or reuse) a modal element and attach robust open/close behaviour.
  // Behaviour improvements:
  // - Add an overlay that closes the modal when clicked
  // - Close on Escape
  // - Trap focus minimally by moving focus to the close button and restoring it on close
  // - Prevent background scroll while modal is open
  let modal = document.getElementById('help-modal');
  const previousActive = document.activeElement;

  function closeModal() {
    if (!modal) return;
    document.removeEventListener('keydown', onKeyDown);
    document.body.classList.remove('modal-open');
    // remove the element so repeated opens recreate and listeners are fresh
    modal.remove();
    modal = null;
    if (previousActive && previousActive.focus) previousActive.focus();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') closeModal();
  }

  function onOverlayClick(e) {
    // if click lands on the overlay (not the content), close
    if (e.target && e.target.classList.contains('help-modal-overlay')) {
      closeModal();
    }
  }

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'help-modal';
    modal.className = 'help-modal';
    modal.innerHTML = `
      <div class="help-modal-overlay" tabindex="-1"></div>
      <div class="help-modal-content" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <button class="help-close" aria-label="Close help">&times;</button>
        <h3 id="help-title"></h3>
        <div id="help-text"></div>
      </div>
    `;

    document.body.appendChild(modal);

    // hook close button and overlay
    const closeBtn = modal.querySelector('.help-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', onOverlayClick);
  }

  const titleEl = modal.querySelector('#help-title');
  const textEl = modal.querySelector('#help-text');
  if (titleEl) titleEl.textContent = title || '';
  if (textEl) textEl.textContent = content || '';

  // lock background scroll and attach Escape handler
  document.body.classList.add('modal-open');
  document.addEventListener('keydown', onKeyDown);

  // move focus to close button for keyboard users
  const closeBtn = modal.querySelector('.help-close');
  if (closeBtn && closeBtn.focus) closeBtn.focus();
}
