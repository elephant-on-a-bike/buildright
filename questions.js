// questions.js
const questions = [
  { id: "Q000_NAME", text: "Project name", type: "text", placeholder: "e.g., Office Renovation", conditions: [] },
  { id: "Q000_DESC", text: "Project description", type: "textarea", placeholder: "Briefly describe the project", conditions: [] },
  { id: "Q001_AREA", text: "Total floor area", type: "number", unit: "m2", placeholder: "e.g., 4500", conditions: [] },
  { id: "Q001_FLOORS", text: "Number of floors", type: "number", placeholder: "e.g., 3", conditions: [] },
  { id: "Q001_TYPE", text: "Project type", type: "multiple_choice", options: ["Design", "Construction", "Renovation", "Maintenance"], conditions: [] },
  { id: "Q002_HVAC", text: "Does the project involve HVAC systems?", type: "boolean", conditions: [] },
  { id: "Q003_HVAC_TYPE", text: "What type of HVAC system is required?", type: "multiple_choice", options: ["Split AC", "VRF", "Chiller Plant", "Packaged Rooftop", "Other"], conditions: [{ depends_on: "Q002_HVAC", value: "yes" }] },
  { id: "Q004_LIGHTING", text: "Does the scope include lighting upgrades?", type: "boolean", conditions: [] },
  { id: "Q005_EMERGENCY_LIGHTING", text: "Include emergency lighting?", type: "boolean", conditions: [{ depends_on: "Q004_LIGHTING", value: "yes" }] },
  { id: "Q006_PERMITS", text: "Are permits/approvals required?", type: "boolean", conditions: [{ depends_on: "Q001_TYPE", value: "renovation" }] },
  { id: "Q007_TIMELINE", text: "Target completion timeline (weeks)", type: "number", placeholder: "e.g., 16", conditions: [] },
  { id: "Q008_EXCLUSIONS", text: "List any exclusions (comma-separated)", type: "text", placeholder: "e.g., Furniture, IT/AV systems", conditions: [] },
  { id: "Q009_ASSUMPTIONS", text: "List any key assumptions (comma-separated)", type: "text", placeholder: "e.g., Existing structure is sound", conditions: [] }
];
