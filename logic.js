// logic.js
const responses = {};

// --- Utility ---
function norm(v) {
  if (typeof v !== 'string') return v;
  return v.trim().toLowerCase();
}

// --- Condition check ---
function shouldAsk(question) {
  if (!question.conditions || question.conditions.length === 0) return true;
  return question.conditions.every(cond => {
    const actual = responses[cond.depends_on];
    return norm(actual) === norm(cond.value);
  });
}

// --- Render Questions ---
function renderQuestions() {
  const container = document.getElementById("questionnaire");
  container.innerHTML = "";

  questions.forEach(q => {
    if (shouldAsk(q)) {
      const div = document.createElement("div");
      div.className = "question";

      const label = document.createElement("label");
      label.textContent = q.text + (q.unit ? ` (${q.unit})` : "");
      div.appendChild(label);

      let input;
      if (q.type === "text" || q.type === "number") {
        input = document.createElement("input");
        input.type = q.type;
        if (q.placeholder) input.placeholder = q.placeholder;
      } else if (q.type === "textarea") {
        input = document.createElement("textarea");
        if (q.placeholder) input.placeholder = q.placeholder;
      } else if (q.type === "boolean") {
        input = document.createElement("select");
        const blank = document.createElement("option");
        blank.value = ""; blank.textContent = "Select...";
        input.appendChild(blank);
        ["yes", "no"].forEach(opt => {
          const o = document.createElement("option");
          o.value = opt; o.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
          input.appendChild(o);
        });
      } else if (q.type === "multiple_choice") {
        input = document.createElement("select");
        const blank = document.createElement("option");
        blank.value = ""; blank.textContent = "Select...";
        input.appendChild(blank);
        q.options.forEach(opt => {
          const o = document.createElement("option");
          o.value = opt; o.textContent = opt;
          input.appendChild(o);
        });
      }

      input.onchange = () => {
        responses[q.id] = input.value;
        renderQuestions();
        updateSpecPreview();
      };

      if (responses[q.id] !== undefined) {
        input.value = responses[q.id];
      }

      div.appendChild(input);
      container.appendChild(div);
    }
  });
}

// --- Build structured output ---
function buildOutput() {
  const name = responses["Q000_NAME"] || "Untitled Project";
  const desc = responses["Q000_DESC"] || "";
  const type = responses["Q001_TYPE"];

  const rawResponses = Object.entries(responses).map(([qid, ans]) => {
    const q = questions.find(q => q.id === qid);
    return { question_id: qid, question_text: q ? q.text : qid, answer: ans };
  });

  const disciplines = [];
  if (responses["Q002_HVAC"] === "yes") disciplines.push("HVAC");
  if (responses["Q004_LIGHTING"] === "yes") disciplines.push("Electrical");
  if (responses["Q001_FLOORS"] || responses["Q001_AREA"]) disciplines.push("Structural");

  const exclusions = (responses["Q008_EXCLUSIONS"] || "")
    .split(",").map(s => s.trim()).filter(Boolean);
  const assumptions = (responses["Q009_ASSUMPTIONS"] || "")
    .split(",").map(s => s.trim()).filter(Boolean);

  return {
    project: { id: "P-EXAMPLE-001", title: name, description: desc },
    metadata: { created_at: new Date().toISOString(), status: "in_progress" },
    responses: rawResponses,
    derived_scope: {
      disciplines: disciplines.length ? [...new Set(disciplines)] : ["General"],
      project_type: type || "General"
    },
    specification_outline: {
      scope_of_work: [
        type ? `${type} project` : "General works",
        responses["Q002_HVAC"] === "yes" && responses["Q003_HVAC_TYPE"]
          ? `Installation of ${responses["Q003_HVAC_TYPE"]} HVAC system` : null,
        responses["Q004_LIGHTING"] === "yes"
          ? `Upgrade of lighting systems${responses["Q005_EMERGENCY_LIGHTING"] === "yes" ? " including emergency lighting" : ""}` : null
      ].filter(Boolean),
      exclusions: exclusions.length ? exclusions : ["None specified"],
      assumptions: assumptions.length ? assumptions : ["None specified"]
    },
    pricing_outline: {
      categories: [
        { category: "Civil/Structural", estimated_cost_range: "TBD" },
        ...(responses["Q002_HVAC"] === "yes"
          ? [{ category: "Mechanical (HVAC)", estimated_cost_range: "TBD" }] : []),
        ...(responses["Q004_LIGHTING"] === "yes"
          ? [{ category: "Electrical", estimated_cost_range: "TBD" }] : [])
      ]
    }
  };
}

// --- Human-centric spec preview ---
function updateSpecPreview() {
  const out = buildOutput();
  const scopeLines = out.specification_outline.scope_of_work.map(s => `<li>${s}</li>`).join("");
  const exclusions = out.specification_outline.exclusions.map(s => `<li>${s}</li>`).join("");
  const assumptions = out.specification_outline.assumptions.map(s => `<li>${s}</li>`).join("");
  const disciplines = out.derived_scope.disciplines.join(", ");

  const html = `
    <div><strong>Project title:</strong> ${out.project.title}</div>
    <div><strong>Description:</strong> ${out.project.description || "<span class='muted'>None provided</span>"}</div>
    <hr />
    <div><strong>Scope of work:</strong><ul>${scopeLines || "<li class='muted'>Pending inputs</li>"}</ul></div>
    <div><strong>Disciplines involved:</strong> ${disciplines}</div>
    <div><strong>Exclusions:</strong><ul>${exclusions}</ul></div>
    <div><strong>Assumptions:</strong><ul>${assumptions}</ul></div>
    <div><strong>Pricing outline:</strong>
      <ul>${out.pricing_outline.categories.map(c => `<li>${c.category} — Estimated cost: <em>${c.estimated_cost_range}</em></li>`).join("")}</ul>
    </div>
    <div class="muted">Generated: ${new Date(out.metadata.created_at).toLocaleString()}</div>
  `;
  document.getElementById("specPreview").innerHTML = html;
}
