const questions = [
  {
    id: "Q000_NAME",
    text: "Project name",
    type: "text",
    placeholder: "e.g., Office Renovation",
    conditions: [],
    info: "Provide a short, descriptive name so the project can be easily identified in reports and communications."
  },
  {
    id: "Q001_TYPE",
    text: "Project type",
    type: "multiple_choice",
    options: ["Design", "Construction", "Renovation", "Maintenance"],
    conditions: [],
    info: "Select the overall nature of the project. This determines which disciplines and regulatory steps are relevant."
  },
  {
    id: "Q000_DESC",
    text: "Project description",
    type: "textarea",
    placeholder: "Briefly describe the project",
	conditions: [
	  { depends_on: "Q001_TYPE", value: ["Design", "Construction", "Renovation"] }
	],
    info: "Give a high-level overview of the project, such as its purpose, location, and main objectives."
  },
  {
    id: "Q001_AREA",
    text: "Total floor area",
    type: "number",
    unit: "m2",
    placeholder: "e.g., 4500",
    conditions: [],
    info: "Enter the total built-up area in square meters. This helps estimate the scale of work and resource requirements."
  },
  {
    id: "Q001_FLOORS",
    text: "Number of floors",
    type: "number",
    placeholder: "e.g., 3",
    conditions: [],
    info: "Specify how many levels the building has. This affects structural, vertical transport, and services planning."
  },
  {
    id: "Q002_HVAC",
    text: "Does the project involve HVAC systems?",
    type: "boolean",
    conditions: [],
    info: "Indicate whether heating, ventilation, or air conditioning systems are part of the scope."
  },
  {
    id: "Q003_HVAC_TYPE",
    text: "What type of HVAC system is required?",
    type: "multiple_choice",
    options: ["Split AC", "VRF", "Chiller Plant", "Packaged Rooftop", "Other"],
    conditions: [{ depends_on: "Q002_HVAC", value: "yes" }],
    info: "Choose the type of HVAC system to be installed. This guides mechanical design and cost estimation."
  },
  {
    id: "Q004_LIGHTING",
    text: "Does the scope include lighting upgrades?",
    type: "boolean",
    conditions: [],
    info: "Confirm if lighting systems are part of the project. This affects electrical design and energy planning."
  },
  {
    id: "Q005_EMERGENCY_LIGHTING",
    text: "Include emergency lighting?",
    type: "boolean",
    conditions: [{ depends_on: "Q004_LIGHTING", value: "yes" }],
    info: "If lighting is included, specify whether emergency lighting should also be provided for safety compliance."
  },
  {
    id: "Q006_PERMITS",
    text: "Are permits/approvals required?",
    type: "boolean",
    conditions: [{ depends_on: "Q001_TYPE", value: "renovation" }],
    info: "Some projects, especially renovations, require permits or approvals from local authorities. Indicate if this applies."
  },
  {
    id: "Q007_TIMELINE",
    text: "Target completion timeline (weeks)",
    type: "number",
    placeholder: "e.g., 16",
    conditions: [],
    info: "Enter the expected duration in weeks. This helps with scheduling and resource allocation."
  },
  {
    id: "Q008_EXCLUSIONS",
    text: "List any exclusions (comma-separated)",
    type: "text",
    placeholder: "e.g., Furniture, IT/AV systems",
    conditions: [],
    info: "List items or services that are explicitly not part of the project scope, to avoid misunderstandings later."
  },
  {
    id: "Q009_ASSUMPTIONS",
    text: "List any key assumptions (comma-separated)",
    type: "text",
    placeholder: "e.g., Existing structure is sound",
    conditions: [],
    info: "Note any assumptions being made, such as site access or existing conditions. These clarify the basis of the scope."
  },
  {
  id: "Q010_SITE_ACCESS",
  text: "Are there any site access restrictions?",
  type: "textarea",
  placeholder: "e.g., Limited working hours, restricted delivery routes",
  info: "Tell us if there are any constraints on accessing the site, such as delivery restrictions or working hour limits.",
  conditionGroups: [
    // Group 1: Renovation AND Permits = yes
    [
      { depends_on: "Q001_TYPE", value: "Renovation" },
      { depends_on: "Q006_PERMITS", value: "yes" }
    ],
    // Group 2: Construction project type
    [
      { depends_on: "Q001_TYPE", value: "Construction" }
    ]
  ]
	}
];
