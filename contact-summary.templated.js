const thisContact = contact;
const thisLineage = lineage;
const allReports = reports;

// Stock monitoring
const configs = require('./stock-monitoring.config.json');
const { getStockMonitoringSummaryCards } = require('@medic/cht-stock-monitoring-workflow');

// --- Helper Functions ---

// Assuming the duration field in reports is something like 'medication_duration' in days
const getMedicationDuration = (report) => {
  const duration = report.fields && report.fields.medication_duration;
  return duration ? parseInt(duration, 10) : 7; // default to 7 days if not explicitly defined
};

// Determines if a temporary condition is still active (duration * 2)
const isConditionActive = (reportDate, durationDays) => {
  const activeDurationMs = durationDays * 2 * 24 * 60 * 60 * 1000;
  const now = new Date().getTime();
  const reportTime = new Date(reportDate).getTime();
  return (now - reportTime) <= activeDurationMs;
};

// Check for specific conditions in the report fields
const getReportConditions = (report) => {
  const conditions = [];
  const fields = report.fields || {};

  // Helper function to safely check for 'yes' or 'true' strings
  const isPositive = (val) => val === 'yes' || val === 'true';

  // ==============================
  // CHRONIC CONDITIONS
  // ==============================
  if (isPositive(fields.diabetes) || 
      isPositive(fields._result_hyperglycemia_mild) || 
      isPositive(fields._result_hyperglycemia_moderate) || 
      isPositive(fields._result_hyperglycemia_severe)) {
    conditions.push({ name: 'Diabetes', type: 'chronic' });
  }
  if (isPositive(fields.stroke) || 
      isPositive(fields._result_stroke) || 
      isPositive(fields._result_old_stroke) || 
      isPositive(fields._result_transient_ischemic_attack)) {
    conditions.push({ name: 'Stroke / TIA', type: 'chronic' });
  }
  if (isPositive(fields.hypertension) || 
      isPositive(fields._result_hypertensive_urgency) || 
      isPositive(fields._result_hypertension_grade_1) || 
      isPositive(fields._result_hypertension_grade_2) || 
      isPositive(fields._result_hypertension_grade_3) ||
      isPositive(fields._result_gestational_hypertension_no_serious) ||
      isPositive(fields._result_gestational_hypertension_serious) ||
      isPositive(fields._result_pre_eclampsia)) {
    conditions.push({ name: 'Hypertension', type: 'chronic' });
  }
  if (isPositive(fields.asthma) || isPositive(fields._result_asthma)) {
    conditions.push({ name: 'Asthma', type: 'chronic' });
  }
  if (isPositive(fields._result_tuberculosis)) {
    conditions.push({ name: 'Tuberculosis', type: 'chronic' });
  }

  // ==============================
  // TEMPORARY CONDITIONS
  // ==============================
  // Respiratory & Fever
  if (isPositive(fields.flu) || isPositive(fields._result_flu_like_syndrome)) {
    conditions.push({ name: 'Flu-like Syndrome', type: 'temporary' });
  }
  if (isPositive(fields._result_pneumonia)) {
    conditions.push({ name: 'Pneumonia', type: 'temporary' });
  }
  if (isPositive(fields._result_risk_malaria)) {
    conditions.push({ name: 'Risk of Malaria', type: 'temporary' });
  }

  // Skin
  if (isPositive(fields.skin_condition) || 
      isPositive(fields.impetigo) || 
      isPositive(fields._result_impetigo_folliculitis) ||
      isPositive(fields.scabies) || 
      isPositive(fields._result_scabies) ||
      isPositive(fields.ringworm) || 
      isPositive(fields._result_ring_worm)) {
    conditions.push({ name: 'Skin Condition', type: 'temporary' });
  }

  // Nutrition / Blood
  if (isPositive(fields._result_moderate_anemia)) {
    conditions.push({ name: 'Moderate Anemia', type: 'temporary' });
  }

  // Digestive / Abdominal
  if (isPositive(fields._result_appendicitis_cholecystitis)) {
    conditions.push({ name: 'Appendicitis / Cholecystitis', type: 'temporary' });
  }
  if (isPositive(fields._result_gastritis_serious) || isPositive(fields._result_gastritis_not_serious)) {
    conditions.push({ name: 'Gastritis', type: 'temporary' });
  }
  if (isPositive(fields._result_acute_diarrhea)) {
    conditions.push({ name: 'Acute Diarrhea', type: 'temporary' });
  }
  if (isPositive(fields._result_risk_of_cholera)) {
    conditions.push({ name: 'Risk of Cholera', type: 'temporary' });
  }
  if (isPositive(fields._result_amoeba_giardia)) {
    conditions.push({ name: 'Amoeba / Giardia', type: 'temporary' });
  }

  // Genitourinary & STD
  if (isPositive(fields._result_genitourinary_infections) || isPositive(fields._result_uti)) {
    conditions.push({ name: 'Genitourinary Infection / UTI', type: 'temporary' });
  }
  if (isPositive(fields._result_std_discharge) || isPositive(fields._result_std_ulcer)) {
    conditions.push({ name: 'STD', type: 'temporary' });
  }

  // Pregnancy Complications
  if (isPositive(fields._result_threatened_miscarriage_less20) || isPositive(fields._result_threatened_miscarriage_greater20)) {
    conditions.push({ name: 'Threatened Miscarriage', type: 'temporary' });
  }

  // Generic / System
  if (isPositive(fields.general_ailment)) {
    conditions.push({ name: 'Ailment', type: 'temporary' });
  }
  if (isPositive(fields._result_urgent_referral)) {
    conditions.push({ name: 'Urgent Referral Required', type: 'temporary' });
  }

  return conditions;
};

// Helper function to extract and format drugs from the 'total_*' fields
// Helper function to extract and format drugs recursively from the fields
const getDrugsDistributed = (fields) => {
  const drugs = {};
  
  const traverse = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        traverse(obj[key]);
      } else {
        if (key.includes('total_') || key.includes('_distributed')) {
          const val = Number(obj[key]); 
          // !isNaN filters out the broken "NaN" fields in the root totals
          if (!isNaN(val) && val > 0) {
            // Strip out logic flags and prefixes to format the drug name
            let drugName = key
              .replace(/_?total_?/g, '')
              .replace(/_?data_?/g, '')
              .replace(/_?distributed_?/g, '')
              .replace(/_?sev_?/g, '')
              .replace(/_?preg_?/g, '')
              .replace(/_?scabies_?/g, '')
              .replace(/_?ringworm_?/g, '')
              .replace(/_?additional_?/g, '')
              .replace(/_?gt20_?/g, '')
              .replace(/_/g, ' ')
              .trim();
              
            // Capitalize the first letter of each word
            drugName = drugName.replace(/\b\w/g, char => char.toUpperCase());
            
            // Aggregate in case the same drug was prescribed in different subgroups
            drugs[drugName] = (drugs[drugName] || 0) + val;
          }
        }
      }
    }
  };
  
  traverse(fields);
  
  const drugList = Object.entries(drugs).map(([name, qty]) => `${name}: ${qty}`);
  return drugList.length > 0 ? drugList.join(', ') : 'None';
};

// --- Assessment History Card ---

const assessmentHistoryFields = allReports
  .filter(report => report.form === 'ADT_Form014_Summary' || report.form === 'assessment') // Adjust form IDs as needed
  .sort((a, b) => b.reported_date - a.reported_date) // Newest first
  .map(report => {
    const dateStr = new Date(report.reported_date).toLocaleDateString();
    
    // 1. Get positive conditions using the updated getReportConditions function
    const conditionsFound = getReportConditions(report);
    const conditionsText = conditionsFound.length > 0 
      ? conditionsFound.map(c => c.name).join(', ') 
      : 'None';
      
    // 2. Get the specific drugs and their quantities
    const drugsText = getDrugsDistributed(report.fields || {});
    
    return {
      label: `Assessment on ${dateStr}`,
      // Use standard string formatting (the \n creates a new line in most CHT versions, 
      // otherwise it will render as a space separating the two statements)
      value: `Screened positive for: ${conditionsText} \nDrugs distributed: ${drugsText}`,
      width: 12
    };
  });

const assessmentHistoryCard = {
  label: 'Assessment History',
  appliesToType: 'person',
  fields: assessmentHistoryFields.length ? assessmentHistoryFields : [{ label: 'History', value: 'No assessments found', width: 12 }]
};

// --- Current Conditions Card ---

const activeConditions = [];
const chronicSet = new Set();

allReports.forEach(report => {
  const conditions = getReportConditions(report);
  const medDuration = getMedicationDuration(report);
  
  conditions.forEach(cond => {
    if (cond.type === 'chronic') {
      if (!chronicSet.has(cond.name)) {
        chronicSet.add(cond.name);
        activeConditions.push({ label: 'Chronic Condition', value: cond.name, width: 6 });
      }
    } else if (cond.type === 'temporary') {
      // Check if it's within the window of twice the medication duration
      if (isConditionActive(report.reported_date, medDuration)) {
        activeConditions.push({ label: 'Temporary Condition', value: `${cond.name} (Active)`, width: 6 });
      }
    }
  });
});

const conditionsCard = {
  label: 'Current Conditions',
  appliesToType: 'person',
  fields: activeConditions.length ? activeConditions : [{ label: 'Status', value: 'No active conditions', width: 12 }]
};

// --- Profile Fields ---

const fields = [
  { appliesToType: 'person', label: 'patient_id', value: thisContact.patient_id, width: 4 },
  { appliesToType: 'person', label: 'contact.age', value: thisContact.date_of_birth, width: 4, filter: 'age' },
  { appliesToType: 'person', label: 'contact.sex', value: 'contact.sex.' + thisContact.sex, translate: true, width: 4 },
  { appliesToType: 'person', label: 'person.field.phone', value: thisContact.phone, width: 4 },
  { appliesToType: 'person', label: 'contact.parent', value: thisLineage, filter: 'lineage' },
  { appliesToType: 'person', label: 'contact.role', value: thisContact.role, width: 4 }
];

// --- Final Export ---

const cards = [
  assessmentHistoryCard,
  conditionsCard,
  ...getStockMonitoringSummaryCards(configs, allReports)
];

module.exports = {
  fields: fields,
  cards: cards,
  context: {}
};