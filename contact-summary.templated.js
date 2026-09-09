const thisContact = contact;
const thisLineage = lineage;
//const allReports = reports;

//const extras = require('./contact-summary-extras');
//const { getNewestReport } = extras;

//stock monitoring
const configs = require('./stock-monitoring.config.json');
const { getStockMonitoringSummaryCards } = require('@medic/cht-stock-monitoring-workflow');

const fields = [
  { appliesToType: 'person', label: 'patient_id', value: thisContact.patient_id, width: 4 },
  { appliesToType: 'person', label: 'contact.age', value: thisContact.date_of_birth, width: 4, filter: 'age' },
  { appliesToType: 'person', label: 'contact.sex', value: 'contact.sex.' + thisContact.sex, translate: true, width: 4 },
  { appliesToType: 'person', label: 'person.field.phone', value: thisContact.phone, width: 4 },
  { appliesToType: 'person', label: 'contact.parent', value: thisLineage, filter: 'lineage' },
  ];

  const cards = [
  ...getStockMonitoringSummaryCards(configs,reports)
];

module.exports = {
  fields: fields,
  cards: cards,
  context: {}
};

// TODO() See docs: https://docs.communityhealthtoolkit.org/building/contact-summary/contact-summary-templated/#contact-summary