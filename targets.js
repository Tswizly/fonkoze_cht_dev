module.exports = [
{
  id: 'total-adult-summaries-submitted',
  type: 'count',
  icon: 'icon-document', // You can replace this with any valid CHT icon class
  goal: -1, // Set goal to -1 for targets without a specific target/goal limit
  appliesTo: 'reports',
  appliesToType: ['ADT_Form014_Summary'],
  date: 'now'
}
];
