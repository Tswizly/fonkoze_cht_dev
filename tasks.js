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
  route_uti_std: ['ADT_Form009_UTIandSTD'], 
  route_wound: ['ADT_Form011_Wounds'],
  route_vision: ['ADT_Form010_Vision'],
  route_diabetes: ['ADT_Form001_Diabetes'],
  route_anemia: ['ADT_Form013_Anemia']
};

// Mapping of route flags in triage forms to Elderly follow-up form names
const ELDERLY_ROUTE_FORM_MAPPING = {
  route_digestive: ['ADT_Form002_DigestiveConditions'],
  route_fever: ['ADT_Form003_Fever'],
  route_hypertension: ['ADT_Form004_Hypertension'],
  route_respiratory: ['ELD_Form006_RespiratoryConditions'], // Overridden
  route_skin: ['ADT_Form007_SkinConditions'],
  route_stroke: ['ADT_Form008_Stroke'],
  route_uti_std: ['ELD_Form009_UTIandSTD'], // Overridden
  route_wound: ['ADT_Form011_Wounds'],
  route_vision: ['ADT_Form010_Vision'],
  route_diabetes: ['ADT_Form001_Diabetes'],
  route_anemia: ['ADT_Form013_Anemia'],
  route_chronic_pain: ['ELD_Form001_ChronicPain'] // Elderly specific
};

// Mapping of route flags in triage forms to Child follow-up form names
const CHILDREN_ROUTE_FORM_MAPPING = {
  route_anemia_malnutrition: ['CHD_Form008_Malnutrition_Anemia'],
  route_digestive: ['CHD_Form001_DigestiveConditions'],
  route_respiratory: ['CHD_Form002_RespiratoryInfections'],
  route_skin: ['CHD_Form003_SkinConditions'],
  route_wound: ['CHD_Form005_Wounds'],
  route_vision: ['CHD_Form004_Vision'],
};

// Mapping of route flags in triage forms to Youth/Adolescent follow-up form names
const YOUTH_ROUTE_FORM_MAPPING = {
  route_anemia: ['YAA_Form008_Malnutrition_Anemia'],
  route_digestive: ['YAA_Form001_DigestiveConditions'],
  route_respiratory: ['YAA_Form002_RespiratoryConditions'],
  route_skin: ['YAA_Form003_SkinConditions'],
  route_uti_std: ['YAA_Form004_UTIandSTD'],
  route_wound: ['YAA_Form006_Wounds'],
  route_vision: ['YAA_Form005_Vision']
};

const TRIAGE_FORM_NAMES = ['TRI_Form001_Triage', 'GEN_Form001_FormSelect', 'TRI_Form002_Child_Triage'];

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

// Helper to check encounter limits
function isLatestTriageEncounter(c, r) {
  const subsequentTriageReports = (c.reports || []).filter(report =>
    TRIAGE_FORM_NAMES.includes(report.form) &&
    report.reported_date > r.reported_date &&
    report._id !== r._id
  );
  return subsequentTriageReports.length === 0;
}

// Helper function to search across encounter forms for clinical calculation fields
function getEncounterFieldValue(encounterReports, fieldName, defaultValue = 'false') {
  for (const report of encounterReports) {
    if (!report.fields) continue;

    const cleanName = fieldName.startsWith('_') ? fieldName.substring(1) : fieldName;
    const prefixedName = fieldName.startsWith('_') ? fieldName : '_' + fieldName;

    if (report.fields[fieldName] !== undefined && report.fields[fieldName] !== '') return report.fields[fieldName];
    if (report.fields[cleanName] !== undefined && report.fields[cleanName] !== '') return report.fields[cleanName];
    if (report.fields[prefixedName] !== undefined && report.fields[prefixedName] !== '') return report.fields[prefixedName];

    if (report.fields.data) {
      if (report.fields.data[fieldName] !== undefined && report.fields.data[fieldName] !== '') return report.fields.data[fieldName];
      if (report.fields.data[cleanName] !== undefined && report.fields.data[cleanName] !== '') return report.fields.data[cleanName];
      if (report.fields.data[prefixedName] !== undefined && report.fields.data[prefixedName] !== '') return report.fields.data[prefixedName];
    }
  }
  return defaultValue;
}

module.exports = [
  ...getStockMonitoringTasks(configs),
  
  // ----------------------------------------------------
  // ROUTE SUMMARY FORM - CHILDREN (0-5)
  // ----------------------------------------------------
  {
    name: 'triage_final_summary_children',
    title: 'Child Health Checkup Final Summary',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: TRIAGE_FORM_NAMES,

    appliesIf: function(c, r) {
      if (c.contact && c.contact.muted) return false;
      if (!r.fields || r.fields.patient_age_in_years > 5) return false;
      if (!isLatestTriageEncounter(c, r)) return false;

      const summaryAlreadySubmitted = (c.reports || []).some(report =>
        report.reported_date >= r.reported_date && report.form === 'CHD_Form009_Summary'
      );
      if (summaryAlreadySubmitted) return false;

      const requiredFormGroups = [];
      Object.keys(CHILDREN_ROUTE_FORM_MAPPING).forEach(routeKey => {
        if (r.fields && r.fields[routeKey] === 'true') {
          requiredFormGroups.push(CHILDREN_ROUTE_FORM_MAPPING[routeKey]);
        }
      });

      // Check if patient was flagged for emergency symptoms in the triage form
      if (r.fields && r.fields.has_emergency_symptoms === 'true') return true;

      if (requiredFormGroups.length === 0) return true;

      return requiredFormGroups.every(formNames =>
        isFormSubmittedInEncounter(c, r, null, formNames)
      );
    },

    actions: [
      {
        form: 'CHD_Form009_Summary',
        modifyContent: function(content, c, r) {
          const encounterReports = (c.reports || []).filter(report => report.reported_date >= r.reported_date);

          // Emergency Symptoms Mapping
          content._has_emergency_symptoms = getEncounterFieldValue(encounterReports, '_has_emergency_symptoms');
          content._emergency_dehydration = getEncounterFieldValue(encounterReports, '_emergency_dehydration');
          content._emergency_respiratory_distress = getEncounterFieldValue(encounterReports, '_emergency_respiratory_distress');
          content._emergency_altered_consciousness = getEncounterFieldValue(encounterReports, '_emergency_altered_consciousness');
          content._emergency_acute_malnutrition = getEncounterFieldValue(encounterReports, '_emergency_acute_malnutrition');
          content._emergency_bloated_extremities = getEncounterFieldValue(encounterReports, '_emergency_bloated_extremities');

          // Preventive Care Mapping
          content._needs_vitamin_a = getEncounterFieldValue(encounterReports, '_needs_vitamin_a');
          content._needs_albendazole = getEncounterFieldValue(encounterReports, '_needs_albendazole');
          content._vaccinated_as_expected = getEncounterFieldValue(encounterReports, '_vaccinated_as_expected');
          
          // Respiratory Infections (from CHD_Form002)
          content._result_severe_pneumonia = getEncounterFieldValue(encounterReports, '_result_severe_pneumonia');
          content._result_pneumonia = getEncounterFieldValue(encounterReports, '_result_pneumonia');
          content._result_cough_or_cold = getEncounterFieldValue(encounterReports, '_result_cough_or_cold');
          content._result_tonsillitis = getEncounterFieldValue(encounterReports, '_result_tonsillitis');
          content._result_flu_like_syndrome = getEncounterFieldValue(encounterReports, '_result_flu_like_syndrome');

          // Digestive Conditions (from CHD_Form001 - Note: source form uses _calc_ prefix)
          content._result_severe_dehydration = getEncounterFieldValue(encounterReports, '_calc_severe_dehydration');
          content._result_some_dehydration = getEncounterFieldValue(encounterReports, '_calc_some_dehydration');
          content._result_no_dehydration = getEncounterFieldValue(encounterReports, '_calc_no_dehydration');
          content._result_persistent_diarrhea = getEncounterFieldValue(encounterReports, '_calc_persistent_diarrhea');
          content._result_dysentery = getEncounterFieldValue(encounterReports, '_calc_dysentery');
          content._result_gastritis = getEncounterFieldValue(encounterReports, '_calc_gastritis');
          content._result_cholera = getEncounterFieldValue(encounterReports, '_calc_cholera');

          // Skin Conditions (from CHD_Form003)
          content._result_impetigo = getEncounterFieldValue(encounterReports, '_result_impetigo');
          content._result_ring_worm = getEncounterFieldValue(encounterReports, '_result_ring_worm');
          content._result_scabies = getEncounterFieldValue(encounterReports, '_result_scabies');

          // Malnutrition & Anemia (from CHD_Form008)
          content._result_severe_malnutrition_anemia = getEncounterFieldValue(encounterReports, '_result_severe_malnutrition_anemia');
          content._result_severe_anemia = getEncounterFieldValue(encounterReports, '_result_severe_anemia');
          content._result_moderate_anemia = getEncounterFieldValue(encounterReports, '_result_moderate_anemia');
          
          // General / Referral 
          content._result_urgent_referral = getEncounterFieldValue(encounterReports, '_result_urgent_referral');
        }
      }
    ],

    events: [{ start: 0, days: 0, end: 30 }]
  },

  // ----------------------------------------------------
  // ROUTE SUMMARY FORM - YOUTH/ADOLESCENT (6-17)
  // ----------------------------------------------------
  {
    name: 'triage_final_summary_youth',
    title: 'Youth Health Checkup Final Summary',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: TRIAGE_FORM_NAMES,

    appliesIf: function(c, r) {
      if (c.contact && c.contact.muted) return false;
      if (!r.fields || r.fields.patient_age_in_years < 6 || r.fields.patient_age_in_years > 17) return false;
      if (!isLatestTriageEncounter(c, r)) return false;

      const summaryAlreadySubmitted = (c.reports || []).some(report =>
        report.reported_date >= r.reported_date && report.form === 'YAA_Form009_Summary'
      );
      if (summaryAlreadySubmitted) return false;

      const requiredFormGroups = [];
      Object.keys(YOUTH_ROUTE_FORM_MAPPING).forEach(routeKey => {
        if (r.fields && r.fields[routeKey] === 'true') {
          requiredFormGroups.push(YOUTH_ROUTE_FORM_MAPPING[routeKey]);
        }
      });

      // Check if patient was flagged for emergency symptoms in the triage form
      if (r.fields && r.fields.has_emergency_symptoms === 'true') return true;

      if (requiredFormGroups.length === 0) return true;

      return requiredFormGroups.every(formNames =>
        isFormSubmittedInEncounter(c, r, null, formNames)
      );
    },

    actions: [
      {
        form: 'YAA_Form009_Summary',
        modifyContent: function(content, c, r) {
          const encounterReports = (c.reports || []).filter(report => report.reported_date >= r.reported_date);

          // Emergency Symptoms Mapping from Triage
          content._has_emergency_symptoms = getEncounterFieldValue(encounterReports, '_has_emergency_symptoms');
          content._emergency_dehydration = getEncounterFieldValue(encounterReports, '_emergency_dehydration');
          content._emergency_respiratory_distress = getEncounterFieldValue(encounterReports, '_emergency_respiratory_distress');
          content._emergency_altered_consciousness = getEncounterFieldValue(encounterReports, '_emergency_altered_consciousness');
          content._emergency_acute_malnutrition = getEncounterFieldValue(encounterReports, '_emergency_acute_malnutrition');
          content._emergency_bloated_extremities = getEncounterFieldValue(encounterReports, '_emergency_bloated_extremities');
          
          // Respiratory Conditions (from YAA_Form002)
          content._result_flu_like_syndrome = getEncounterFieldValue(encounterReports, '_result_flu_like_syndrome');
          content._result_pneumonia_pink = getEncounterFieldValue(encounterReports, '_result_pneumonia_pink');
          content._result_pneumonia_yellow = getEncounterFieldValue(encounterReports, '_result_pneumonia_yellow');
          content._result_tonsillitis = getEncounterFieldValue(encounterReports, '_result_tonsillitis');

          // Digestive Conditions (from YAA_Form001)
          content._result_gastritis = getEncounterFieldValue(encounterReports, '_result_gastritis');
          content._result_dehydration = getEncounterFieldValue(encounterReports, '_result_dehydration');
          content._result_dysentery = getEncounterFieldValue(encounterReports, '_result_dysentery');

          // Skin Conditions (from YAA_Form003)
          content._result_impetigo = getEncounterFieldValue(encounterReports, '_result_impetigo');
          content._result_ring_worm = getEncounterFieldValue(encounterReports, '_result_ring_worm');
          content._result_scabies = getEncounterFieldValue(encounterReports, '_result_scabies');

          // UTI and STD (from YAA_Form004)
          content._result_uti = getEncounterFieldValue(encounterReports, '_result_uti');
          content._result_glomerulonephritis = getEncounterFieldValue(encounterReports, '_result_glomerulonephritis');
          content._result_syphilis = getEncounterFieldValue(encounterReports, '_result_syphilis');
          content._result_other_std = getEncounterFieldValue(encounterReports, '_result_other_std');

          // Malnutrition & Anemia (from YAA_Form008)
          content._result_anemia = getEncounterFieldValue(encounterReports, '_result_anemia');
          
          // General / Referral
          content._result_urgent_referral = getEncounterFieldValue(encounterReports, '_result_urgent_referral');
        }
      }
    ],

    events: [{ start: 0, days: 0, end: 30 }]
  },

  // ----------------------------------------------------
  // ROUTE SUMMARY FORM - ADULT (18-64)
  // ----------------------------------------------------
  {
    name: 'triage_final_summary_adult',
    title: 'Health Checkup Final Summary',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: TRIAGE_FORM_NAMES,

    appliesIf: function(c, r) {
      if (c.contact && c.contact.muted) return false;
      if (!r.fields || r.fields.patient_age_in_years < 18 || r.fields.patient_age_in_years > 64) return false;
      if (!isLatestTriageEncounter(c, r)) return false;

      const summaryAlreadySubmitted = (c.reports || []).some(report =>
        report.reported_date >= r.reported_date && report.form === 'ADT_Form014_Summary'
      );
      if (summaryAlreadySubmitted) return false;

      const requiredFormGroups = [];
      Object.keys(ADULT_ROUTE_FORM_MAPPING).forEach(routeKey => {
        if (r.fields && r.fields[routeKey] === 'true') {
          requiredFormGroups.push(ADULT_ROUTE_FORM_MAPPING[routeKey]);
        }
      });

      // Check if patient was flagged for emergency symptoms in the triage form
      if (r.fields && r.fields.has_emergency_symptoms === 'true') return true;

      if (requiredFormGroups.length === 0) return true;

      return requiredFormGroups.every(formNames =>
        isFormSubmittedInEncounter(c, r, null, formNames)
      );
    },

    actions: [
      {
        form: 'ADT_Form014_Summary',
        modifyContent: function(content, c, r) {
          const encounterReports = (c.reports || []).filter(report => report.reported_date >= r.reported_date);

          content._has_emergency_symptoms = getEncounterFieldValue(encounterReports,'_has_emergency_symptoms');
          
          content._result_hyperglycemia_mild = getEncounterFieldValue(encounterReports, '_result_hyperglycemia_mild');
          content._result_hyperglycemia_moderate = getEncounterFieldValue(encounterReports, '_result_hyperglycemia_moderate');
          content._result_hyperglycemia_severe = getEncounterFieldValue(encounterReports, '_result_hyperglycemia_severe');
          content._metformin_dosage = getEncounterFieldValue(encounterReports, '_metformin_dosage', '');
          
          content._result_gastritis_serious = getEncounterFieldValue(encounterReports, '_result_gastritis_serious');
          content._result_gastritis_not_serious = getEncounterFieldValue(encounterReports, '_result_gastritis_not_serious');
          content._h_pylori_rapid_test_result = getEncounterFieldValue(encounterReports, '_h_pylori_rapid_test_result', '');
          content._result_risk_of_cholera = getEncounterFieldValue(encounterReports, '_result_risk_of_cholera');
          content._result_acute_diarrhea = getEncounterFieldValue(encounterReports, '_result_acute_diarrhea');
          content._result_amoeba_giardia = getEncounterFieldValue(encounterReports, '_result_amoeba_giardia');
          content._result_appendicitis_cholecystitis = getEncounterFieldValue(encounterReports, '_result_appendicitis_cholecystitis');

          content._result_risk_malaria = getEncounterFieldValue(encounterReports, '_result_risk_malaria');
          content._malaria_rapid_test_result = getEncounterFieldValue(encounterReports, '_malaria_rapid_test_result', '');

          content._result_hypertensive_urgency = getEncounterFieldValue(encounterReports, '_result_hypertensive_urgency');
          content._result_hypertension_grade_1 = getEncounterFieldValue(encounterReports, '_result_hypertension_grade_1');
          content._result_hypertension_grade_2 = getEncounterFieldValue(encounterReports, '_result_hypertension_grade_2');
          content._result_hypertension_grade_3 = getEncounterFieldValue(encounterReports, '_result_hypertension_grade_3');

          content._result_gestational_hypertension_no_serious = getEncounterFieldValue(encounterReports, '_result_gestational_hypertension_no_serious');
          content._result_gestational_hypertension_serious = getEncounterFieldValue(encounterReports, '_result_gestational_hypertension_serious');
          content._result_pre_eclampsia = getEncounterFieldValue(encounterReports, '_result_pre_eclampsia');
          content._result_genitourinary_infections = getEncounterFieldValue(encounterReports, '_result_genitourinary_infections');
          content._result_threatened_miscarriage_less20 = getEncounterFieldValue(encounterReports, '_result_threatened_miscarriage_less20');
          content._result_threatened_miscarriage_greater20 = getEncounterFieldValue(encounterReports, '_result_threatened_miscarriage_greater20');

          content._result_tuberculosis = getEncounterFieldValue(encounterReports, '_result_tuberculosis');
          content._result_asthma = getEncounterFieldValue(encounterReports, '_result_asthma');
          content._result_pneumonia = getEncounterFieldValue(encounterReports, '_result_pneumonia');
          content._result_flu_like_syndrome = getEncounterFieldValue(encounterReports, '_result_flu_like_syndrome');

          content._result_impetigo_folliculitis = getEncounterFieldValue(encounterReports, '_result_impetigo_folliculitis');
          content._result_ring_worm = getEncounterFieldValue(encounterReports, '_result_ring_worm');
          content._result_scabies = getEncounterFieldValue(encounterReports, '_result_scabies');

          content._result_transient_ischemic_attack = getEncounterFieldValue(encounterReports, '_result_transient_ischemic_attack');
          content._result_stroke = getEncounterFieldValue(encounterReports, '_result_stroke');
          content._result_old_stroke = getEncounterFieldValue(encounterReports, '_result_old_stroke');

          content._result_uti = getEncounterFieldValue(encounterReports, '_result_uti');
          content._result_std_discharge = getEncounterFieldValue(encounterReports, '_result_std_discharge');
          content._result_std_ulcer = getEncounterFieldValue(encounterReports, '_result_std_ulcer');

          content._result_moderate_anemia = getEncounterFieldValue(encounterReports, '_result_moderate_anemia');
        }
      }
    ],

    events: [{ start: 0, days: 0, end: 30 }]
  },

  // ----------------------------------------------------
  // ROUTE SUMMARY FORM - ELDERLY (> 64)
  // ----------------------------------------------------
  {
    name: 'triage_final_summary_elderly',
    title: 'Elderly Health Checkup Final Summary',
    icon: 'icon-healthcare',
    appliesTo: 'reports',
    appliesToType: TRIAGE_FORM_NAMES,

    appliesIf: function(c, r) {
      if (c.contact && c.contact.muted) return false;
      if (!r.fields || r.fields.patient_age_in_years <= 64) return false;
      if (!isLatestTriageEncounter(c, r)) return false;

      const summaryAlreadySubmitted = (c.reports || []).some(report =>
        report.reported_date >= r.reported_date && report.form === 'ELD_Form012_Summary'
      );
      if (summaryAlreadySubmitted) return false;

      const requiredFormGroups = [];
      Object.keys(ELDERLY_ROUTE_FORM_MAPPING).forEach(routeKey => {
        if (r.fields && r.fields[routeKey] === 'true') {
          requiredFormGroups.push(ELDERLY_ROUTE_FORM_MAPPING[routeKey]);
        }
      });

      // Check if patient was flagged for emergency symptoms in the triage form
      if (r.fields && r.fields.has_emergency_symptoms === 'true') return true;

      if (requiredFormGroups.length === 0) return true;

      return requiredFormGroups.every(formNames =>
        isFormSubmittedInEncounter(c, r, null, formNames)
      );
    },

    actions: [
      {
        form: 'ELD_Form012_Summary',
        modifyContent: function(content, c, r) {
          const encounterReports = (c.reports || []).filter(report => report.reported_date >= r.reported_date);

                    content._has_emergency_symptoms = getEncounterFieldValue(encounterReports,'_has_emergency_symptoms');
          
          content._result_hyperglycemia_mild = getEncounterFieldValue(encounterReports, '_result_hyperglycemia_mild');
          content._result_hyperglycemia_moderate = getEncounterFieldValue(encounterReports, '_result_hyperglycemia_moderate');
          content._result_hyperglycemia_severe = getEncounterFieldValue(encounterReports, '_result_hyperglycemia_severe');
          content._metformin_dosage = getEncounterFieldValue(encounterReports, '_metformin_dosage', '');
          content._result_gastritis_serious = getEncounterFieldValue(encounterReports, '_result_gastritis_serious');
          content._result_gastritis_not_serious = getEncounterFieldValue(encounterReports, '_result_gastritis_not_serious');
          content._h_pylori_rapid_test_result = getEncounterFieldValue(encounterReports, '_h_pylori_rapid_test_result', '');
          content._result_risk_of_cholera = getEncounterFieldValue(encounterReports, '_result_risk_of_cholera');
          content._result_acute_diarrhea = getEncounterFieldValue(encounterReports, '_result_acute_diarrhea');
          content._result_amoeba_giardia = getEncounterFieldValue(encounterReports, '_result_amoeba_giardia');
          content._result_appendicitis_cholecystitis = getEncounterFieldValue(encounterReports, '_result_appendicitis_cholecystitis');
          content._result_risk_malaria = getEncounterFieldValue(encounterReports, '_result_risk_malaria');
          content._malaria_rapid_test_result = getEncounterFieldValue(encounterReports, '_malaria_rapid_test_result', '');
          content._result_hypertensive_urgency = getEncounterFieldValue(encounterReports, '_result_hypertensive_urgency');
          content._result_hypertension_grade_1 = getEncounterFieldValue(encounterReports, '_result_hypertension_grade_1');
          content._result_hypertension_grade_2 = getEncounterFieldValue(encounterReports, '_result_hypertension_grade_2');
          content._result_hypertension_grade_3 = getEncounterFieldValue(encounterReports, '_result_hypertension_grade_3');
          content._result_impetigo_folliculitis = getEncounterFieldValue(encounterReports, '_result_impetigo_folliculitis');
          content._result_ring_worm = getEncounterFieldValue(encounterReports, '_result_ring_worm');
          content._result_scabies = getEncounterFieldValue(encounterReports, '_result_scabies');
          content._result_transient_ischemic_attack = getEncounterFieldValue(encounterReports, '_result_transient_ischemic_attack');
          content._result_stroke = getEncounterFieldValue(encounterReports, '_result_stroke');
          content._result_old_stroke = getEncounterFieldValue(encounterReports, '_result_old_stroke');
          content._result_moderate_anemia = getEncounterFieldValue(encounterReports, '_result_moderate_anemia');

          content._result_tuberculosis = getEncounterFieldValue(encounterReports, '_result_tuberculosis');
          content._result_asthma = getEncounterFieldValue(encounterReports, '_result_asthma');
          content._result_pneumonia = getEncounterFieldValue(encounterReports, '_result_pneumonia');
          content._result_flu_like_syndrome = getEncounterFieldValue(encounterReports, '_result_flu_like_syndrome');
          content._result_uti = getEncounterFieldValue(encounterReports, '_result_uti');
          content._result_std_discharge = getEncounterFieldValue(encounterReports, '_result_std_discharge');
          content._result_std_ulcer = getEncounterFieldValue(encounterReports, '_result_std_ulcer');
          content._result_chronic_pain = getEncounterFieldValue(encounterReports, '_result_chronic_pain');
          content._result_referral_needed = getEncounterFieldValue(encounterReports, '_result_referral_needed');
        }
      }
    ],

    events: [{ start: 0, days: 0, end: 30 }]
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
];

