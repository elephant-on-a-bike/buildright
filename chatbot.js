// Updated chatbot.js with working help button and modal
let questions = [];
let answers = {};
let keywordMap = {};
let questionHistory = [];

document.getElementById('start-btn').addEventListener('click', startChat);

async function startChat() {
  document.getElementById('start-btn').style.display = 'none';
  document.getElementById('loader').style.display = 'block';

  const [questionsRes, keywordsRes] = await Promise.all([
    fetch('questions.json'),
    fetch('keywords.json')
  ]);

  questions = await questionsRes.json();
  keywordMap = await keywordsRes.json();

  document.getElementById('loader').style.display = 'none';
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
  const lower = text.toLowerCase();
  for (const keyword in keywordMap) {
    if (lower.includes(keyword)) {
      const prefill = keywordMap[keyword];
      for (const key in prefill) {
        answers[key] = prefill[key];
      }
    }
  }
  answers["project_description"] = text;
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

      helpBtn.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#374151"/>
        <text x="12" y="16" text-anchor="middle" font-size="14" fill="#ffffff" font-family="Arial" font-weight="bold" dy=".3em">?</text>
      </svg>
    `;
    
      helpBtn.addEventListener('click', () => showHelpModal(next.question, next.help));
      questionRow.appendChild(helpBtn);
    }

    wrapper.appendChild(questionRow);

    if (next.type === 'select') {
      next.options.forEach(option => {
        const btn = document.createElement('button');
        btn.textContent = option;
        btn.className = 'btn btn-secondary';
        btn.addEventListener('click', () => {
          answers[next.id] = option;
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
        showNextQuestion();
      });

      backWrapper.appendChild(backBtn);
      container.appendChild(backWrapper);
    }
  }, 600);
}

function evaluateConditions(question) {
  if (!question.conditions) return true;
  const { all, any } = question.conditions;

  if (all) {
    return all.every(cond => answers[cond.id] === cond.value);
  }
  if (any) {
    return any.some(cond => answers[cond.id] === cond.value);
  }
  return true;
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
  container.appendChild(summary);
}

function showHelpModal(title, content) {
  let modal = document.getElementById('help-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'help-modal';
    modal.className = 'help-modal';
    modal.innerHTML = `
      <div class="help-modal-content">
        <span class="help-close" id="help-close">&times;</span>
        <h3 id="help-title"></h3>
        <p id="help-text"></p>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('help-close').addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  document.getElementById('help-title').textContent = title;
  document.getElementById('help-text').textContent = content;
  modal.style.display = 'block';
}
