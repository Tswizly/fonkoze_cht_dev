const getField = (report, fieldPath) => ['fields', ...(fieldPath || '').split('.')]
  .reduce((prev, fieldName) => {
    if (prev === undefined) { return undefined; }
    return prev[fieldName];
  }, report);

function isAlive(contact) {
  return contact && contact.contact && !contact.contact.date_of_death;
}  

module.exports = {
  getField,
  isAlive
};