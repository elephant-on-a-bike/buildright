// keywordRules.js (or inline in logic.js)
const keywordRules = [
  {
    keywords: ["hvac", "air conditioning", "ventilation", "ac"],
    action: () => { responses["Q002_HVAC"] = "yes"; }
  },
  {
    keywords: ["lighting", "led", "illumination"],
    action: () => { responses["Q004_LIGHTING"] = "yes"; }
  },
  {
    keywords: ["renovation", "refurbishment"],
    action: () => { responses["Q001_TYPE"] = "Renovation"; }
  },
  {
    keywords: ["construction", "new build"],
    action: () => { responses["Q001_TYPE"] = "Construction"; }
  }
];
