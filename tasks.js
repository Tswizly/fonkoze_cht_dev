const configs = require('./stock-monitoring.config.json');
const { getStockMonitoringTasks } = require('@medic/cht-stock-monitoring-workflow');

// Mapping of route flags in triage forms to Adult follow-up form names
const ADULT_ROUTE_FORM_MAPPING = {
  route_digestive: ['ADT_Form002_DigestiveConditions'],
  route_fever: ['ADT_Form003_Fever'],
  route_hypertension: ['ADT_Form004_Hypertension'],
  route_pregnancy: ['ADT_Form005_Pregnancy'],
  route_respiratory: ['ADT_Form006_RespiratoryConditions'],
  route_skin: ['ADT_Form007_SkinConditions'],
  route_stroke: ['ADT_Form008_Stroke'],
  route_uti_std: ['ADT_Form009_UTlandSTD'],
  route_wound: ['ADT_Form011_Wounds'],
  route_vision: ['ADT_Form010_Vision'],
  route_diabetes: ['ADT_Form001_Diabetes']
};

const TRIAGE_FORM_NAMES = ['TRI_Form001_Triage', 'GEN_Form001_FormSelect'];

/**
 * Checks if a specific form was submitted during this specific triage encounter window.
 */
function isFormSubmittedInEncounter(contact, triageReport, nextTriageReportDate, formNames) {
  return (contact.reports || []).some(report => {
    const submittedAfterTriage = report.reported_date >= triageReport.reported_date;
    const submittedBeforeNextTriage = !nextTriageReportDate || report.reported_date < nextTriageReportDate;
    
    return submittedAfterTriage && submittedBeforeNextTriage && formNames.includes(report.form);
  });
}

module.exports = [
  ...getStockMonitoringTasks(configs),
  // ----------------------------------------------------
  // ROUTE SUMMARY FORM 
  // ----------------------------------------------------
  {
    name: 'triage_final_summary_simple',
    title: 'Health Checkup Final Summary',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: TRIAGE_FORM_NAMES,

    appliesIf: function(c, r) {
      // 1. Skip if contact is muted
      if (c.contact && c.contact.muted) {
        return false;
      }

      // 2. ENCOUNTER WINDOW BOUNDARY CHECK:
      // Find the next triage/form-select report created AFTER this report `r` (if any).
      const subsequentTriageReports = (c.reports || []).filter(report =>
        TRIAGE_FORM_NAMES.includes(report.form) &&
        report.reported_date > r.reported_date &&
        report._id !== r._id
      );

      // If a newer triage report exists, this old triage task is superseded and should NOT trigger.
      if (subsequentTriageReports.length > 0) {
        return false;
      }

      // Date threshold for the current encounter window
      const nextTriageDate = null; // Since `r` is the latest triage report, there is no upper bound yet.

      // 3. Skip if summary form was already submitted for this current triage encounter
      const summaryAlreadySubmitted = (c.reports || []).some(report =>
        report.reported_date >= r.reported_date &&
        report.form === 'ADT_Form014_Summary'
      );

      if (summaryAlreadySubmitted) {
        return false;
      }

      // 4. Determine required adult forms based on route_* flags set to 'true' in `r`
      const requiredFormGroups = [];
      Object.keys(ADULT_ROUTE_FORM_MAPPING).forEach(routeKey => {
        if (r.fields && r.fields[routeKey] === 'true') {
          requiredFormGroups.push(ADULT_ROUTE_FORM_MAPPING[routeKey]);
        }
      });

      // If no follow-up forms were required by this triage, show the summary task immediately
      if (requiredFormGroups.length === 0) {
        return true;
      }

      // 5. Verify that EVERY required route has a corresponding form completed WITHIN this encounter window
      const allTasksCompleted = requiredFormGroups.every(formNames =>
        isFormSubmittedInEncounter(c, r, nextTriageDate, formNames)
      );

      return allTasksCompleted;
    },

    actions: [
      {
        form: 'ADT_Form014_Summary'
      }
    ],

    events: [
      { start: 0, days: 0, end: 30 }
    ]
  },
  // ----------------------------------------------------
  // DIGESTIVE CONDITIONS
  // ----------------------------------------------------
  {
    name: 'children_triage_route_digestive',
    title: 'Digestive Conditions Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
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
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_diabetes === 'true' && r.fields.patient_age_in_years > 64;
    },
    actions: [{ form: 'ELD_Form002_Diabetes' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
    // ----------------------------------------------------
  // Vaccinations and Deowormer
  // ----------------------------------------------------
  {
    name: 'child_triage_route_vac',
    title: 'Vaccinations and Dewormer Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_vaccinations === 'true' && r.fields.patient_age_in_years >= 0 && r.fields.patient_age_in_years <= 5;
    },
    actions: [{ form: 'CHD_Form006_Vaccines_and_Dewormer' }],
    events: [{ start: 1, days: 1, end: 0 }]
  }
];

