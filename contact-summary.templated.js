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

// Check for specific conditions in the report fields (customize based on exact field names in your form)
const getReportConditions = (report) => {
  const conditions = [];
  const fields = report.fields || {};
  
  // Chronic Conditions
  if (fields.diabetes === 'yes' || fields._result_diabetes) conditions.push({ name: 'Diabetes', type: 'chronic' });
  if (fields.stroke === 'yes' || fields._result_stroke) conditions.push({ name: 'Stroke', type: 'chronic' });
  if (fields.hypertension === 'yes' || fields._result_htn) conditions.push({ name: 'Hypertension', type: 'chronic' });
  if (fields.asthma === 'yes' || fields._result_asthma) conditions.push({ name: 'Asthma', type: 'chronic' });

  // Temporary Conditions
  if (fields.flu === 'yes' || fields._result_flu_like_syndrome) conditions.push({ name: 'Flu', type: 'temporary' });
  if (fields.skin_condition === 'yes' || fields.impetigo === 'yes' || fields.scabies === 'yes' || fields.ringworm === 'yes') conditions.push({ name: 'Skin Condition', type: 'temporary' });
  if (fields.general_ailment === 'yes') conditions.push({ name: 'Ailment', type: 'temporary' });

  return conditions;
};

// --- Assessment History Card ---

const assessmentHistoryFields = allReports
  .filter(report => report.form === 'ADT_Form014_Summary' || report.form === 'assessment') // Adjust form IDs as needed
  .sort((a, b) => b.reported_date - a.reported_date) // Newest first
  .map(report => {
    const dateStr = new Date(report.reported_date).toLocaleDateString();
    const drugs = report.fields && report.fields.drugs_administered ? report.fields.drugs_administered : 'None recorded';
    
    return {
      label: `Assessment on ${dateStr}`,
      value: `Drugs Administered: ${drugs}`,
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