// This file provides internationalization (i18n) support for the application,
// containing string translations for English, Igbo, Hausa, and Yoruba.

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

export const translations: Translations = {
  en: {
    // General
    settings: 'Settings',
    patient: 'Patient',
    
    // Patient Dashboard
    patientDashboard: 'Patient Dashboard',
    dashboard: 'Dashboard',
    appointments: 'Appointments',
    messages: 'Messages',
    prescriptions: 'Prescriptions',
    billing: 'Billing & Payments',
    medicalRecords: 'Medical Records',
    symptomChecker: 'AI Health Assistant',
    healthMetrics: 'Health Metrics',
    
    // Overview
    goodMorning: 'Good Morning',
    goodAfternoon: 'Good Afternoon',
    goodEvening: 'Good Evening',
    whatToDo: 'What would you like to do today?',
    quickActions: 'Quick Actions',
    bookAppointment: 'Book Appointment',
    checkSymptoms: 'Check Symptoms',
    viewBills: 'View Bills',
    viewRecords: 'View Records',
    upcomingAppointment: 'Upcoming Appointment',
    noUpcomingAppointments: 'No upcoming appointments',
    with: 'with',
    todaysVitals: "Today's Vitals",
    vitalsSummary: 'Vitals Summary',
    notifications: 'Notifications',
    newLabResults: 'Your new lab results are available for review.',
    paymentDue: 'A payment is due for your recent consultation.',
    medicationRefill: 'Your prescription for Lisinopril is ready for a refill.',
    viewAll: 'View all notifications'
  },
  ig: {
    // General
    settings: 'Ntọala',
    patient: 'Onye ọrịa',
    
    // Patient Dashboard
    patientDashboard: 'Dashboard Onye ọrịa',
    dashboard: 'Dashboard',
    appointments: 'Nleta Dọkịta',
    messages: 'Ozi',
    prescriptions: 'Ọgwụ',
    billing: 'Ịkwụ ụgwọ',
    medicalRecords: 'Ndekọ ahụike',
    symptomChecker: 'AI Nnyocha Mgbaàmà',
    healthMetrics: 'Mmetụta Ahụike',

    // Overview
    goodMorning: 'Ụtụtụ ọma',
    goodAfternoon: 'Ehihie ọma',
    goodEvening: 'Mgbede ọma',
    whatToDo: 'Kedu ihe ị ga-achọ ime taa?',
    upcomingAppointment: 'Nleta Dọkịta na-abịanụ',
    noUpcomingAppointments: 'Enweghị nleta dọkịta na-abịanụ',
    with: 'na',
    todaysVitals: 'Vitals Taa',
    vitalsSummary: 'Nchịkọta Vitals',
    notifications: 'Nkwupụta',
    newLabResults: 'Nsonaazụ ụlọ nyocha ọhụrụ gị dị maka nyocha.',
    paymentDue: 'Akwụ ụgwọ ruru maka ndụmọdụ gị na nso nso a.',
    medicationRefill: 'Ndegharị ọgwụ gị maka Lisinopril adịla njikere.',
    viewAll: 'Lelee ọkwa niile'
  },
  ha: {
    // General
    settings: 'Saiti',
    patient: 'Mai haƙuri',
    
    // Patient Dashboard
    patientDashboard: 'Dashboard Mai haƙuri',
    dashboard: 'Dashboard',
    appointments: 'Alƙawura',
    messages: 'Saƙonni',
    prescriptions: 'Takardar magani',
    billing: 'Biyan kuɗi',
    medicalRecords: 'Bayanan Lafiya',
    symptomChecker: 'AI Mai Binciken Alamomi',
    healthMetrics: "Ma'aunin Lafiya",

    // Overview
    goodMorning: 'Barka da safiya',
    goodAfternoon: 'Barka da rana',
    goodEvening: 'Barka da yamma',
    whatToDo: 'Me kuke so ku yi a yau?',
    upcomingAppointment: 'Alƙawari mai zuwa',
    noUpcomingAppointments: 'Babu alƙawari mai zuwa',
    with: 'tare da',
    todaysVitals: 'Vitals na Yau',
    vitalsSummary: 'Takaitaccen Vitals',
    notifications: 'Sanarwa',
    newLabResults: 'Sakamakon sabon dakin gwaje-gwajenku yana samuwa don dubawa.',
    paymentDue: 'Ana biyan kuɗi don shawarwarinku na kwanan nan.',
    medicationRefill: 'Takardar maganin ku na Lisinopril a shirye take don sake cikawa.',
    viewAll: 'Duba duk sanarwa'
  },
  yo: {
    // General
    settings: 'Ètò',
    patient: 'Aláisàn',
    
    // Patient Dashboard
    patientDashboard: 'Dashboard Aláisàn',
    dashboard: 'Dashboard',
    appointments: 'Àwọn ìpàdé',
    messages: 'Àwọn ìránṣẹ́',
    prescriptions: 'Ìwé oògùn',
    billing: 'Ìsanwó',
    medicalRecords: 'Àkọsílẹ̀ Ìlera',
    symptomChecker: 'Olùṣàyẹ̀wò Àmì AI',
    healthMetrics: 'Àwọn ìwọn ìlera',

    // Overview
    goodMorning: 'Ẹ kú àárọ̀',
    goodAfternoon: 'Ẹ kú ọsán',
    goodEvening: 'Ẹ kú alẹ́',
    whatToDo: 'Kí ni ìwọ yóò fẹ́ ṣe lónìí?',
    upcomingAppointment: 'Ìpàdé tó ń bọ̀',
    noUpcomingAppointments: 'Kò sí ìpàdé tó ń bọ̀',
    with: 'pẹ̀lú',
    todaysVitals: 'Vitals Oni',
    vitalsSummary: 'Àkópọ̀ Vitals',
    notifications: 'Àwọn ìfitónilétí',
    newLabResults: 'Àwọn àbájáde yàrá-yàrá tuntun rẹ wà fún àyẹ̀wò.',
    paymentDue: 'O yẹ kí o san owó kan fún ìfọ̀rọ̀wánilẹ́nuwò rẹ àìpẹ́ yìí.',
    medicationRefill: 'Ìwé oògùn rẹ fún Lisinopril ti ṣetan fún àtúnṣe.',
    viewAll: 'Wo gbogbo awọn iwifunni'
  },
};
