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
    name: 'triage_final_summary_adult',
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
      // Verify that this report `r` is the most recent triage/form-select submission.
      const subsequentTriageReports = (c.reports || []).filter(report =>
        TRIAGE_FORM_NAMES.includes(report.form) &&
        report.reported_date > r.reported_date &&
        report._id !== r._id
      );

      if (subsequentTriageReports.length > 0) {
        return false;
      }

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
        isFormSubmittedInEncounter(c, r, null, formNames)
      );

      return allTasksCompleted;
    },

    actions: [
      {
        form: 'ADT_Form014_Summary',
        modifyContent: function(content, c, r) {
          // Filter reports submitted during the current triage encounter
          const encounterReports = (c.reports || []).filter(report =>
            report.reported_date >= r.reported_date
          );

          // Helper function to search across encounter forms for clinical calculation fields
          function getFieldValue(fieldName, defaultValue = 'false') {
            for (const report of encounterReports) {
              if (!report.fields) continue;

              const cleanName = fieldName.startsWith('_') ? fieldName.substring(1) : fieldName;
              const prefixedName = fieldName.startsWith('_') ? fieldName : '_' + fieldName;

              // Search in report.fields
              if (report.fields[fieldName] !== undefined && report.fields[fieldName] !== '') {
                return report.fields[fieldName];
              }
              if (report.fields[cleanName] !== undefined && report.fields[cleanName] !== '') {
                return report.fields[cleanName];
              }
              if (report.fields[prefixedName] !== undefined && report.fields[prefixedName] !== '') {
                return report.fields[prefixedName];
              }

              // Search in nested report.fields.data
              if (report.fields.data) {
                if (report.fields.data[fieldName] !== undefined && report.fields.data[fieldName] !== '') {
                  return report.fields.data[fieldName];
                }
                if (report.fields.data[cleanName] !== undefined && report.fields.data[cleanName] !== '') {
                  return report.fields.data[cleanName];
                }
                if (report.fields.data[prefixedName] !== undefined && report.fields.data[prefixedName] !== '') {
                  return report.fields.data[prefixedName];
                }
              }
            }
            return defaultValue;
          }

          // --- 1. Diabetes Results ---
          content._result_hyperglycemia_mild = getFieldValue('_result_hyperglycemia_mild');
          content._result_hyperglycemia_moderate = getFieldValue('_result_hyperglycemia_moderate');
          content._result_hyperglycemia_severe = getFieldValue('_result_hyperglycemia_severe');
          content._metformin_dosage = getFieldValue('_metformin_dosage', '');

          // --- 2. Digestive / Gastritis Results ---
          content._result_gastritis_serious = getFieldValue('_result_gastritis_serious');
          content._result_gastritis_not_serious = getFieldValue('_result_gastritis_not_serious');
          content._h_pylori_rapid_test_result = getFieldValue('_h_pylori_rapid_test_result', '');
          content._result_risk_of_cholera = getFieldValue('_result_risk_of_cholera');
          content._result_acute_diarrhea = getFieldValue('_result_acute_diarrhea');
          content._result_amoeba_giardia = getFieldValue('_result_amoeba_giardia');
          content._result_appendicitis_cholecystitis = getFieldValue('_result_appendicitis_cholecystitis');

          // --- 3. Fever & Malaria Results ---
          content._result_risk_malaria = getFieldValue('_result_risk_malaria');
          content._malaria_rapid_test_result = getFieldValue('_malaria_rapid_test_result', '');

          // --- 4. Hypertension Results ---
          content._result_hypertensive_urgency = getFieldValue('_result_hypertensive_urgency');
          content._result_hypertension_grade_1 = getFieldValue('_result_hypertension_grade_1');
          content._result_hypertension_grade_2 = getFieldValue('_result_hypertension_grade_2');
          content._result_hypertension_grade_3 = getFieldValue('_result_hypertension_grade_3');

          // --- 5. Pregnancy & Gestational Conditions ---
          content._result_gestational_hypertension_no_serious = getFieldValue('_result_gestational_hypertension_no_serious');
          content._result_gestational_hypertension_serious = getFieldValue('_result_gestational_hypertension_serious');
          content._result_pre_eclampsia = getFieldValue('_result_pre_eclampsia');
          content._result_genitourinary_infections = getFieldValue('_result_genitourinary_infections');
          content._result_threatened_miscarriage_less20 = getFieldValue('_result_threatened_miscarriage_less20');
          content._result_threatened_miscarriage_greater20 = getFieldValue('_result_threatened_miscarriage_greater20');

          // --- 6. Respiratory, TB, Asthma, Pneumonia & Flu ---
          content._result_tuberculosis = getFieldValue('_result_tuberculosis');
          content._result_asthma = getFieldValue('_result_asthma');
          content._result_pneumonia = getFieldValue('_result_pneumonia');
          content._result_flu_like_syndrome = getFieldValue('_result_flu_like_syndrome');

          // --- 7. Skin Conditions ---
          content._result_impetigo_folliculitis = getFieldValue('_result_impetigo_folliculitis');
          content._result_ring_worm = getFieldValue('_result_ring_worm');
          content._result_scabies = getFieldValue('_result_scabies');

          // --- 8. Stroke & TIA ---
          content._result_transient_ischemic_attack = getFieldValue('_result_transient_ischemic_attack');
          content._result_stroke = getFieldValue('_result_stroke');
          content._result_old_stroke = getFieldValue('_result_old_stroke');

          // --- 9. UTI & STDs ---
          content._result_uti = getFieldValue('_result_uti');
          content._result_std_discharge = getFieldValue('_result_std_discharge');
          content._result_std_ulcer = getFieldValue('_result_std_ulcer');

          // --- 10. Anemia ---
          content._result_moderate_anemia = getFieldValue('_result_moderate_anemia');
        }
      }
    ],

    events: [
      { start: 0, days: 0, end: 30 }
    ]
  },
  // ----------------------------------------------------
  // ANEMIA & MALNUTRITION
  // ----------------------------------------------------
  {
    name: 'children_triage_route_anemia',
    title: 'Malnutrition & Anemia Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_anemia_malnutrition === 'true' && r.fields.patient_age_in_years >= 0 && r.fields.patient_age_in_years <= 5;
    },
    actions: [{ form: 'CHD_Form008_Malnutrition_Anemia' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'youth_triage_route_anemia',
    title: 'Malnutrition & Anemia Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_anemia === 'true' && r.fields.patient_age_in_years >= 6 && r.fields.patient_age_in_years <= 17;
    },
    actions: [{ form: 'YAA_Form008_Malnutrition_Anemia' }],
    events: [{ start: 1, days: 1, end: 0 }]
  },
  {
    name: 'adult_triage_route_anemia',
    title: 'Anemia Follow-up Assessment',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: ['TRI_Form001_Triage', 'TRI_Form002_Child_Triage','GEN_Form001_FormSelect'],
    appliesIf: function(c, r) {
      return !c.contact.muted && r.fields.route_anemia === 'true' && r.fields.patient_age_in_years >= 18;
    },
    actions: [{ form: 'ADT_Form013_Anemia' }],
    events: [{ start: 1, days: 1, end: 0 }]
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
      return !c.contact.muted && r.fields.route_digestive === 'true' && r.fields.patient_age_in_years >= 18;
    },
    actions: [{ form: 'ADT_Form002_DigestiveConditions' }],
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
      return !c.contact.muted && r.fields.route_fever === 'true' && r.fields.patient_age_in_years >= 18;
    },
    actions: [{ form: 'ADT_Form003_Fever' }],
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
      return !c.contact.muted && r.fields.route_hypertension === 'true' && r.fields.patient_age_in_years >= 18;
    },
    actions: [{ form: 'ADT_Form004_Hypertension' }],
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
      return !c.contact.muted && r.fields.route_skin === 'true' && r.fields.patient_age_in_years >= 18;
    },
    actions: [{ form: 'ADT_Form007_SkinConditions' }],
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
      return !c.contact.muted && r.fields.route_stroke === 'true' && r.fields.patient_age_in_years >= 18;
    },
    actions: [{ form: 'ADT_Form008_Stroke' }],
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
      return !c.contact.muted && r.fields.route_wound === 'true' && r.fields.patient_age_in_years >= 18;
    },
    actions: [{ form: 'ADT_Form011_Wounds' }],
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
      return !c.contact.muted && r.fields.route_vision === 'true' && r.fields.patient_age_in_years >= 18;
    },
    actions: [{ form: 'ADT_Form010_Vision' }],
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
      return !c.contact.muted && r.fields.route_diabetes === 'true' && r.fields.patient_age_in_years >= 18;
    },
    actions: [{ form: 'ADT_Form001_Diabetes' }],
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

