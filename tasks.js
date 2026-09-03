module.exports = [
  // ----------------------------------------------------
  // DIGESTIVE CONDITIONS
  // ----------------------------------------------------
  {
    name: 'children_triage_route_digestive',
    title: 'Digestive Conditions Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_digestive === 'true' && r.fields.patient_age_in_years >= 0 && r.fields.patient_age_in_years <= 5;
    },
    actions: [{ form: 'CHD_Form001_DigestiveConditions' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'youth_triage_route_digestive',
    title: 'Digestive Conditions Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_digestive === 'true' && r.fields.patient_age_in_years >= 6 && r.fields.patient_age_in_years <= 17;
    },
    actions: [{ form: 'YAA_Form001_DigestiveConditions' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'adult_triage_route_digestive',
    title: 'Digestive Conditions Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_digestive === 'true' && r.fields.patient_age_in_years >= 18 && r.fields.patient_age_in_years <= 64;
    },
    actions: [{ form: 'ADT_Form002_DigestiveConditions' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'elderly_triage_route_digestive',
    title: 'Digestive Conditions Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_digestive === 'true' && r.fields.patient_age_in_years > 64;
    },
    actions: [{ form: 'ELD_Form003_DigestiveConditions' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },

  // ----------------------------------------------------
  // FEVER
  // ----------------------------------------------------
  {
    name: 'adult_triage_route_fever',
    title: 'Fever Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_fever === 'true' && r.fields.patient_age_in_years >= 18 && r.fields.patient_age_in_years <= 64;
    },
    actions: [{ form: 'ADT_Form003_Fever' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'elderly_triage_route_fever',
    title: 'Fever Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_fever === 'true' && r.fields.patient_age_in_years > 64;
    },
    actions: [{ form: 'ELD_Form004_Fever' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },

  // ----------------------------------------------------
  // HYPERTENSION
  // ----------------------------------------------------
  {
    name: 'adult_triage_route_hypertension',
    title: 'Hypertension Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_hypertension === 'true' && r.fields.patient_age_in_years >= 18 && r.fields.patient_age_in_years <= 64;
    },
    actions: [{ form: 'ADT_Form004_Hypertension' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'elderly_triage_route_hypertension',
    title: 'Hypertension Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_hypertension === 'true' && r.fields.patient_age_in_years > 64;
    },
    actions: [{ form: 'ELD_Form005_Hypertension' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },

  // ----------------------------------------------------
  // PREGNANCY
  // ----------------------------------------------------
  {
    name: 'adult_triage_route_pregnancy',
    title: 'Pregnancy Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_pregnancy === 'true' && r.fields.patient_age_in_years >= 18 && r.fields.patient_age_in_years <= 64;
    },
    actions: [{ form: 'ADT_Form005_Pregnancy' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },

  // ----------------------------------------------------
  // RESPIRATORY CONDITIONS & INFECTIONS
  // ----------------------------------------------------
  {
    name: 'children_triage_route_respiratory',
    title: 'Respiratory Infections Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_respiratory === 'true' && r.fields.patient_age_in_years >= 0 && r.fields.patient_age_in_years <= 5;
    },
    actions: [{ form: 'CHD_Form002_RespiratoryInfections' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'youth_triage_route_respiratory',
    title: 'Respiratory Conditions Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_respiratory === 'true' && r.fields.patient_age_in_years >= 6 && r.fields.patient_age_in_years <= 17;
    },
    actions: [{ form: 'YAA_Form002_RespiratoryConditions' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'adult_triage_route_respiratory',
    title: 'Respiratory Conditions Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_respiratory === 'true' && r.fields.patient_age_in_years >= 18 && r.fields.patient_age_in_years <= 64;
    },
    actions: [{ form: 'ADT_Form006_RespiratoryConditions' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'elderly_triage_route_respiratory',
    title: 'Respiratory Conditions Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_respiratory === 'true' && r.fields.patient_age_in_years > 64;
    },
    actions: [{ form: 'ELD_Form006_RespiratoryConditions' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },

  // ----------------------------------------------------
  // SKIN CONDITIONS
  // ----------------------------------------------------
  {
    name: 'children_triage_route_skin',
    title: 'Skin Conditions Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_skin === 'true' && r.fields.patient_age_in_years >= 0 && r.fields.patient_age_in_years <= 5;
    },
    actions: [{ form: 'CHD_Form003_SkinConditions' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'youth_triage_route_skin',
    title: 'Skin Conditions Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_skin === 'true' && r.fields.patient_age_in_years >= 6 && r.fields.patient_age_in_years <= 17;
    },
    actions: [{ form: 'YAA_Form003_SkinConditions' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'adult_triage_route_skin',
    title: 'Skin Conditions Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_skin === 'true' && r.fields.patient_age_in_years >= 18 && r.fields.patient_age_in_years <= 64;
    },
    actions: [{ form: 'ADT_Form007_SkinConditions' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'elderly_triage_route_skin',
    title: 'Skin Conditions Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_skin === 'true' && r.fields.patient_age_in_years > 64;
    },
    actions: [{ form: 'ELD_Form007_SkinConditions' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },

  // ----------------------------------------------------
  // STROKE
  // ----------------------------------------------------
  {
    name: 'adult_triage_route_stroke',
    title: 'Stroke Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_stroke === 'true' && r.fields.patient_age_in_years >= 18 && r.fields.patient_age_in_years <= 64;
    },
    actions: [{ form: 'ADT_Form008_Stroke' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'elderly_triage_route_stroke',
    title: 'Stroke Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_stroke === 'true' && r.fields.patient_age_in_years > 64;
    },
    actions: [{ form: 'ELD_Form008_Stroke' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },

  // ----------------------------------------------------
  // UTI AND STD
  // ----------------------------------------------------
  {
    name: 'youth_triage_route_uti_std',
    title: 'UTI and STD Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_uti_std === 'true' && r.fields.patient_age_in_years >= 6 && r.fields.patient_age_in_years <= 17;
    },
    actions: [{ form: 'YAA_Form004_UTIandSTD' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'adult_triage_route_uti_std',
    title: 'UTI and STD Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_uti_std === 'true' && r.fields.patient_age_in_years >= 18 && r.fields.patient_age_in_years <= 64;
    },
    actions: [{ form: 'ADT_Form009_UTIandSTD' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'elderly_triage_route_uti_std',
    title: 'UTI and STD Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_uti_std === 'true' && r.fields.patient_age_in_years > 64;
    },
    actions: [{ form: 'ELD_Form009_UTIandSTD' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },

  // ----------------------------------------------------
  // WOUNDS
  // ----------------------------------------------------
  {
    name: 'children_triage_route_wound',
    title: 'Wounds Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_wound === 'true' && r.fields.patient_age_in_years >= 0 && r.fields.patient_age_in_years <= 5;
    },
    actions: [{ form: 'CHD_Form005_Wounds' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'youth_triage_route_wound',
    title: 'Wounds Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_wound === 'true' && r.fields.patient_age_in_years >= 6 && r.fields.patient_age_in_years <= 17;
    },
    actions: [{ form: 'YAA_Form006_Wounds' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'adult_triage_route_wound',
    title: 'Wounds Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_wound === 'true' && r.fields.patient_age_in_years >= 18 && r.fields.patient_age_in_years <= 64;
    },
    actions: [{ form: 'ADT_Form011_Wounds' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'elderly_triage_route_wound',
    title: 'Wounds Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_wound === 'true' && r.fields.patient_age_in_years > 64;
    },
    actions: [{ form: 'ELD_Form011_Wounds' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },

  // ----------------------------------------------------
  // VISION
  // ----------------------------------------------------
  {
    name: 'children_triage_route_vision',
    title: 'Vision Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_vision === 'true' && r.fields.patient_age_in_years >= 0 && r.fields.patient_age_in_years <= 5;
    },
    actions: [{ form: 'CHD_Form004_Vision' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'youth_triage_route_vision',
    title: 'Vision Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_vision === 'true' && r.fields.patient_age_in_years >= 6 && r.fields.patient_age_in_years <= 17;
    },
    actions: [{ form: 'YAA_Form005_Vision' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'adult_triage_route_vision',
    title: 'Vision Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_vision === 'true' && r.fields.patient_age_in_years >= 18 && r.fields.patient_age_in_years <= 64;
    },
    actions: [{ form: 'ADT_Form010_Vision' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'elderly_triage_route_vision',
    title: 'Vision Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_vision === 'true' && r.fields.patient_age_in_years > 64;
    },
    actions: [{ form: 'ELD_Form010_Vision' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },

  // ----------------------------------------------------
  // DIABETES
  // ----------------------------------------------------
  {
    name: 'adult_triage_route_diabetes',
    title: 'Diabetes Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_diabetes === 'true' && r.fields.patient_age_in_years >= 18 && r.fields.patient_age_in_years <= 64;
    },
    actions: [{ form: 'ADT_Form001_Diabetes' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'elderly_triage_route_diabetes',
    title: 'Diabetes Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_diabetes === 'true' && r.fields.patient_age_in_years > 64;
    },
    actions: [{ form: 'ELD_Form002_Diabetes' }],
    events: [{ start: 1, days: 1, end: 0 }]
  }
];