// main.js
document.getElementById("finishBtn").onclick = () => {
  const output = buildOutput();
  document.getElementById("output").textContent = JSON.stringify(output, null, 2);
};

document.getElementById("resetBtn").onclick = () => {
  for (const k of Object.keys(responses)) delete responses[k];
  document.getElementById("output").textContent = "Click Finish to generate the structured JSON output.";
  document.getElementById("specPreview").textContent = "Fill in the questionnaire to see a live, human-readable project scope.";
  renderQuestions();
};

// Initial render
renderQuestions();
updateSpecPreview();
