module.exports = [
  // ==========================================
  // 1. Assessment & Utilization Volume
  // ==========================================
  
  {
    id: 'total_monthly_assessments',
    translation_key: 'targets.assessments.total',
    type: 'count',
    icon: 'icon-healthcare',
    goal: -1,
    appliesTo: 'reports',
    appliesToType: ['CHD_Form009_Summary', 'YAA_Form009_Summary', 'ADT_Form014_Summary', 'ELD_Form012_Summary'],
    date: 'reported'
  },
  {
    id: 'assessments_chd',
    translation_key: 'targets.assessments.demographic.chd',
    type: 'count',
    icon: 'icon-child',
    goal: -1,
    appliesTo: 'reports',
    appliesToType: ['CHD_Form009_Summary'],
    date: 'reported'
  },
  {
    id: 'assessments_yaa',
    translation_key: 'targets.assessments.demographic.yaa',
    type: 'count',
    icon: 'icon-youth',
    goal: -1,
    appliesTo: 'reports',
    appliesToType: ['YAA_Form009_Summary'],
    date: 'reported'
  },
  {
    id: 'assessments_adt',
    translation_key: 'targets.assessments.demographic.adt',
    type: 'count',
    icon: 'icon-person',
    goal: -1,
    appliesTo: 'reports',
    appliesToType: ['ADT_Form014_Summary'],
    date: 'reported'
  },
  {
    id: 'assessments_eld',
    translation_key: 'targets.assessments.demographic.eld',
    type: 'count',
    icon: 'icon-elderly',
    goal: -1,
    appliesTo: 'reports',
    appliesToType: ['ELD_Form012_Summary'],
    date: 'reported'
  },
  {
    id: 'assessments_female',
    translation_key: 'targets.assessments.gender.female',
    type: 'count',
    icon: 'icon-female',
    goal: -1,
    appliesTo: 'reports',
    appliesToType: ['CHD_Form009_Summary', 'YAA_Form009_Summary', 'ADT_Form014_Summary', 'ELD_Form012_Summary'],
    date: 'reported',
    appliesIf: function(contact, report) {
      return report.fields && report.fields.patient_sex === 'female';
    }
  },
  {
    id: 'assessments_male',
    translation_key: 'targets.assessments.gender.male',
    type: 'count',
    icon: 'icon-male',
    goal: -1,
    appliesTo: 'reports',
    appliesToType: ['CHD_Form009_Summary', 'YAA_Form009_Summary', 'ADT_Form014_Summary', 'ELD_Form012_Summary'],
    date: 'reported',
    appliesIf: function(contact, report) {
      return report.fields && report.fields.patient_sex === 'male';
    }
  },

  // ==========================================
  // 2. Condition Prevalence & Morbidity
  // ==========================================

  {
    id: 'positive_condition_rate',
    translation_key: 'targets.condition.positive_rate',
    type: 'percent',
    icon: 'icon-warning',
    goal: -1,
    appliesTo: 'reports',
    appliesToType: ['CHD_Form009_Summary', 'YAA_Form009_Summary', 'ADT_Form014_Summary', 'ELD_Form012_Summary'],
    date: 'reported',
    passesIf: function(contact, report) {
      return report.fields && (report.fields.has_positive_condition === 'true' || report.fields.has_positive_condition === '1');
    }
  },
  {
    id: 'condition_chd_dehydration',
    translation_key: 'targets.condition.chd.dehydration',
    type: 'count',
    icon: 'icon-water',
    goal: -1,
    appliesTo: 'reports',
    appliesToType: ['CHD_Form009_Summary'],
    date: 'reported',
    appliesIf: function(contact, report) {
      return report.fields && (
        Number(report.fields._data_treatment_severe_dehydration_distributed) > 0 || 
        Number(report.fields._data_ors_some_dehyd_distributed) > 0 || 
        Number(report.fields._data_ors_sev_dehyd_distributed) > 0
      );
    }
  },
  {
    id: 'condition_chd_pneumonia',
    translation_key: 'targets.condition.chd.pneumonia',
    type: 'count',
    icon: 'icon-lungs',
    goal: -1,
    appliesTo: 'reports',
    appliesToType: ['CHD_Form009_Summary'],
    date: 'reported',
    appliesIf: function(contact, report) {
      return report.fields && (
        Number(report.fields._data_amoxicillin_suspension_pneu_distributed) > 0 ||
        Number(report.fields._data_treatment_respiratory_distress_distributed) > 0
      );
    }
  },
  {
    id: 'condition_chd_malnutrition',
    translation_key: 'targets.condition.chd.malnutrition',
    type: 'count',
    icon: 'icon-nutrition',
    goal: -1,
    appliesTo: 'reports',
    appliesToType: ['CHD_Form009_Summary'],
    date: 'reported',
    appliesIf: function(contact, report) {
      return report.fields && Number(report.fields._data_treatment_acute_malnutrition_distributed) > 0;
    }
  },
  {
    id: 'condition_adult_preeclampsia',
    translation_key: 'targets.condition.adult.preeclampsia',
    type: 'count',
    icon: 'icon-blood-pressure',
    goal: -1,
    appliesTo: 'reports',
    appliesToType: ['YAA_Form009_Summary', 'ADT_Form014_Summary'],
    date: 'reported',
    appliesIf: function(contact, report) {
      return report.fields && Number(report.fields._data_nifedipine_20mg_pre_eclampsia_distributed) > 0;
    }
  },
  {
    id: 'condition_adult_gastritis',
    translation_key: 'targets.condition.adult.gastritis',
    type: 'count',
    icon: 'icon-stomach',
    goal: -1,
    appliesTo: 'reports',
    appliesToType: ['YAA_Form009_Summary', 'ADT_Form014_Summary', 'ELD_Form012_Summary'],
    date: 'reported',
    appliesIf: function(contact, report) {
      return report.fields && (
        Number(report.fields._data_litacid_gel_distributed) > 0 || 
        Number(report.fields._data_litacid_gel_sev_distributed) > 0 || 
        Number(report.fields._data_omeprazole_20mg_distributed) > 0
      );
    }
  },
  {
    id: 'condition_adult_std',
    translation_key: 'targets.condition.adult.std',
    type: 'count',
    icon: 'icon-infection',
    goal: -1,
    appliesTo: 'reports',
    appliesToType: ['YAA_Form009_Summary', 'ADT_Form014_Summary'],
    date: 'reported',
    appliesIf: function(contact, report) {
      return report.fields && (
        Number(report.fields._data_ciprofloxacin_500mg_std_distributed) > 0 || 
        Number(report.fields._data_doxycycline_100mg_std_distributed) > 0 ||
        Number(report.fields._data_benzathine_penicillin_distributed) > 0
      );
    }
  },
  {
    id: 'condition_adult_malaria',
    translation_key: 'targets.condition.adult.malaria',
    type: 'count',
    icon: 'icon-mosquito',
    goal: -1,
    appliesTo: 'reports',
    appliesToType: ['YAA_Form009_Summary', 'ADT_Form014_Summary', 'ELD_Form012_Summary'],
    date: 'reported',
    appliesIf: function(contact, report) {
      return report.fields && Number(report.fields._data_chloroquine_150mg_distributed) > 0;
    }
  },

  // ==========================================
  // 3. Referral & Risk Management
  // ==========================================

  {
    id: 'urgent_referral_rate',
    translation_key: 'targets.referrals.urgent_rate',
    type: 'percent',
    icon: 'icon-ambulance',
    goal: -1,
    appliesTo: 'reports',
    appliesToType: ['CHD_Form009_Summary', 'YAA_Form009_Summary', 'ADT_Form014_Summary', 'ELD_Form012_Summary'],
    date: 'reported',
    passesIf: function(contact, report) {
      return report.fields && (report.fields._result_urgent_referral === 'true' || report.fields._result_urgent_referral === '1');
    }
  }
];
