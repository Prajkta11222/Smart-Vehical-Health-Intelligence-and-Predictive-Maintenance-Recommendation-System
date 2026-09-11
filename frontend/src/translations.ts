export type Language = 'en' | 'hi' | 'mr';

export interface TranslationSet {
  // Brand & Nav
  brandTitle: string;
  brandSubtitle: string;
  workspace: string;
  dashboard: string;
  vehicles: string;
  newAnalysis: string;
  predictionHistory: string;
  vehicleHealth: string;
  shapAnalysis: string;
  recommendations: string;
  modelInfo: string;
  datasetInfo: string;
  systemStatus: string;
  aiModelActive: string;
  systemHealthy: string;

  // Header & Controls
  searchPlaceholder: string;
  themeToggleDark: string;
  themeToggleLight: string;
  languageSelect: string;

  // Hero
  heroEyebrow: string;
  heroHeadingPrefix: string;
  heroHeadingSuffix: string;
  heroSubheading: string;
  modelBadgeTitle: string;
  modelBadgeSubtitle: string;

  // KPIs
  totalVehicles: string;
  totalVehiclesMeta: string;
  maintenanceRequired: string;
  maintenanceRequiredMeta: string;
  avgHealthScore: string;
  avgHealthScoreMeta: string;
  modelType: string;
  modelTypeMeta: string;

  // Fleet Register Table
  fleetRegisterTitle: string;
  fleetRegisterSubtitle: string;
  colVehicleId: string;
  colModel: string;
  colPrediction: string;
  colProbability: string;
  colHealthScore: string;
  colStatus: string;
  colActions: string;
  viewDetails: string;
  downloadReport: string;

  // Health Distribution
  healthDistributionTitle: string;
  riskProfile: string;
  avgScore: string;
  excellent: string;
  good: string;
  fair: string;
  poor: string;
  critical: string;

  // Analysis Pipeline
  analysisPipeline: string;

  // New Analysis Panel
  newAnalysisEyebrow: string;
  newAnalysisTitle: string;
  newAnalysisSubtitle: string;
  searchVehicleHint: string;
  selectPrompt: string;
  btnAnalyze: string;
  btnAnalyzing: string;
  noVehicleSelected: string;

  // Results & SHAP
  predictionOutcome: string;
  needsMaintenance: string;
  noMaintenance: string;
  failureProbability: string;
  healthScoreLabel: string;
  statusLabel: string;
  topShapFactors: string;
  whyThisPrediction: string;
  savedRecommendations: string;
  suggestedMaintenance: string;
  noSavedRecommendations: string;
  downloadPdfButton: string;

  // History Tab
  historyTitle: string;
  historySubtitle: string;
  historyEmpty: string;
  historyDate: string;
  refreshHistory: string;

  // Alerts & Validation
  errorFetchSummary: string;
  errorFetchShap: string;
  errorSelectVehicle: string;
  errorAnalysisFailed: string;
  reportSuccess: string;
}

export const translations: Record<Language, TranslationSet> = {
  en: {
    brandTitle: 'SMART VEHICLE',
    brandSubtitle: 'HEALTH INTELLIGENCE',
    workspace: 'Workspace',
    dashboard: 'Dashboard',
    vehicles: 'Vehicles',
    newAnalysis: 'New analysis',
    predictionHistory: 'Prediction history',
    vehicleHealth: 'Vehicle health',
    shapAnalysis: 'SHAP analysis',
    recommendations: 'Recommendations',
    modelInfo: 'Model information',
    datasetInfo: 'Dataset information',
    systemStatus: 'System status',
    aiModelActive: 'Active',
    systemHealthy: 'Healthy',

    searchPlaceholder: 'Search vehicle ID...',
    themeToggleDark: 'Switch to Light Mode',
    themeToggleLight: 'Switch to Dark Mode',
    languageSelect: 'Language',

    heroEyebrow: 'MODEL-DRIVEN VEHICLE ANALYSIS',
    heroHeadingPrefix: 'Know what needs attention',
    heroHeadingSuffix: 'before the workshop does.',
    heroSubheading: 'Maintenance prediction, health scoring, and SHAP explanations from your vehicle dataset.',
    modelBadgeTitle: 'Random Forest',
    modelBadgeSubtitle: 'Production model · saved artifact',

    totalVehicles: 'Total vehicles',
    totalVehiclesMeta: 'Dataset records',
    maintenanceRequired: 'Maintenance required',
    maintenanceRequiredMeta: 'Model prediction',
    avgHealthScore: 'Average health score',
    avgHealthScoreMeta: 'Out of 100',
    modelType: 'ML Model',
    modelTypeMeta: 'Selected classifier',

    fleetRegisterTitle: 'Fleet health register',
    fleetRegisterSubtitle: 'Vehicle dataset overview',
    colVehicleId: 'Vehicle ID',
    colModel: 'Model',
    colPrediction: 'Prediction',
    colProbability: 'Probability',
    colHealthScore: 'Health score',
    colStatus: 'Status',
    colActions: 'Actions',
    viewDetails: 'View',
    downloadReport: 'PDF Report',

    healthDistributionTitle: 'Health distribution',
    riskProfile: 'Risk profile',
    avgScore: 'AVG SCORE',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    critical: 'Critical',

    analysisPipeline: 'Analysis pipeline',

    newAnalysisEyebrow: 'New vehicle analysis',
    newAnalysisTitle: 'Select a real vehicle dataset record',
    newAnalysisSubtitle: 'Review practical vehicle details, then run the saved model against the original raw features.',
    searchVehicleHint: 'Type vehicle ID (e.g. FFV2-000001)...',
    selectPrompt: 'Choose a vehicle from the list below to run prediction',
    btnAnalyze: 'Analyze vehicle',
    btnAnalyzing: 'Analyzing vehicle...',
    noVehicleSelected: 'Please select a vehicle record first.',

    predictionOutcome: 'Prediction',
    needsMaintenance: 'Needs maintenance',
    noMaintenance: 'No maintenance',
    failureProbability: 'Failure probability',
    healthScoreLabel: 'Health score',
    statusLabel: 'Health status',
    topShapFactors: 'Top SHAP factors',
    whyThisPrediction: 'Why this prediction?',
    savedRecommendations: 'Saved recommendations',
    suggestedMaintenance: 'Suggested maintenance',
    noSavedRecommendations: 'No saved recommendations for this vehicle.',
    downloadPdfButton: 'Download Health Report (PDF)',

    historyTitle: 'Prediction History',
    historySubtitle: 'Log of previous AI diagnostic evaluations',
    historyEmpty: 'No predictions recorded yet. Run a vehicle analysis to see history here.',
    historyDate: 'Timestamp',
    refreshHistory: 'Refresh History',

    errorFetchSummary: 'Analysis service is unavailable. Verify that FastAPI is running.',
    errorFetchShap: 'SHAP artifact is unavailable.',
    errorSelectVehicle: 'Select a real vehicle dataset record before analyzing.',
    errorAnalysisFailed: 'Vehicle analysis failed. Please verify the backend service.',
    reportSuccess: 'Vehicle Health Report PDF generated successfully!',
  },

  hi: {
    brandTitle: 'स्मार्ट व्हीकल',
    brandSubtitle: 'हेल्थ इंटेलिजेंस',
    workspace: 'कार्यक्षेत्र',
    dashboard: 'डैशबोर्ड',
    vehicles: 'वाहन सूची',
    newAnalysis: 'नया विश्लेषण',
    predictionHistory: 'पूर्वानुमान इतिहास',
    vehicleHealth: 'वाहन स्वास्थ्य',
    shapAnalysis: 'SHAP विश्लेषण',
    recommendations: 'सिफारिशें',
    modelInfo: 'मॉडल जानकारी',
    datasetInfo: 'डेटासेट जानकारी',
    systemStatus: 'सिस्टम स्थिति',
    aiModelActive: 'सक्रिय',
    systemHealthy: 'स्वस्थ',

    searchPlaceholder: 'वाहन आईडी खोजें...',
    themeToggleDark: 'लाइट मोड पर स्विच करें',
    themeToggleLight: 'डार्क मोड पर स्विच करें',
    languageSelect: 'भाषा',

    heroEyebrow: 'मॉडल-संचालित वाहन विश्लेषण',
    heroHeadingPrefix: 'खराबी से पहले जानें',
    heroHeadingSuffix: 'कि किस वाहन को ध्यान चाहिए।',
    heroSubheading: 'आपके वाहन डेटासेट से रखरखाव पूर्वानुमान, स्वास्थ्य स्कोर और SHAP व्याख्या।',
    modelBadgeTitle: 'रैंडम फ़ॉरेस्ट',
    modelBadgeSubtitle: 'उत्पादन मॉडल · सहेजी गई कलाकृति',

    totalVehicles: 'कुल वाहन',
    totalVehiclesMeta: 'डेटासेट रिकॉर्ड',
    maintenanceRequired: 'रखरखाव आवश्यक',
    maintenanceRequiredMeta: 'मॉडल पूर्वानुमान',
    avgHealthScore: 'औसत स्वास्थ्य स्कोर',
    avgHealthScoreMeta: '100 में से',
    modelType: 'एमएल मॉडल',
    modelTypeMeta: 'चयनित क्लासिफायर',

    fleetRegisterTitle: 'फ्लीट स्वास्थ्य रजिस्टर',
    fleetRegisterSubtitle: 'वाहन डेटासेट का विवरण',
    colVehicleId: 'वाहन आईडी',
    colModel: 'मॉडल',
    colPrediction: 'पूर्वानुमान',
    colProbability: 'संभावना',
    colHealthScore: 'स्वास्थ्य स्कोर',
    colStatus: 'स्थिति',
    colActions: 'कार्रवाई',
    viewDetails: 'देखें',
    downloadReport: 'पीडीएफ रिपोर्ट',

    healthDistributionTitle: 'स्वास्थ्य वितरण',
    riskProfile: 'जोखिम प्रोफ़ाइल',
    avgScore: 'औसत स्कोर',
    excellent: 'उत्कृष्ट',
    good: 'अच्छा',
    fair: 'सामान्य',
    poor: 'खराब',
    critical: 'गंभीर',

    analysisPipeline: 'विश्लेषण पाइपलाइन',

    newAnalysisEyebrow: 'नया वाहन विश्लेषण',
    newAnalysisTitle: 'वास्तविक वाहन डेटासेट रिकॉर्ड चुनें',
    newAnalysisSubtitle: 'वाहन विवरण देखें, फिर सहेजे गए मॉडल पर परीक्षण करें।',
    searchVehicleHint: 'वाहन आईडी दर्ज करें (उदा. FFV2-000001)...',
    selectPrompt: 'पूर्वानुमान के लिए सूची से एक वाहन चुनें',
    btnAnalyze: 'वाहन का विश्लेषण करें',
    btnAnalyzing: 'विश्लेषण जारी है...',
    noVehicleSelected: 'कृपया पहले एक वाहन रिकॉर्ड चुनें।',

    predictionOutcome: 'पूर्वानुमान',
    needsMaintenance: 'रखरखाव आवश्यक',
    noMaintenance: 'रखरखाव की आवश्यकता नहीं',
    failureProbability: 'खराबी की संभावना',
    healthScoreLabel: 'स्वास्थ्य स्कोर',
    statusLabel: 'स्वास्थ्य स्थिति',
    topShapFactors: 'शीर्ष SHAP कारक',
    whyThisPrediction: 'यह पूर्वानुमान क्यों?',
    savedRecommendations: 'सुझाए गए रखरखाव',
    suggestedMaintenance: 'सिफारिश की गई कार्रवाई',
    noSavedRecommendations: 'इस वाहन के लिए कोई सहेजी गई सिफारिश नहीं है।',
    downloadPdfButton: 'स्वास्थ्य रिपोर्ट डाउनलोड करें (PDF)',

    historyTitle: 'पूर्वानुमान इतिहास',
    historySubtitle: 'पिछले एआई नैदानिक मूल्यांकनों का रिकॉर्ड',
    historyEmpty: 'अभी तक कोई पूर्वानुमान दर्ज नहीं हुआ। यहां इतिहास देखने के लिए विश्लेषण चलाएं।',
    historyDate: 'समय टिकट',
    refreshHistory: 'इतिहास ताज़ा करें',

    errorFetchSummary: 'विश्लेषण सेवा अनुपलब्ध है। कृपया सुनिश्चित करें कि FastAPI चालू है।',
    errorFetchShap: 'SHAP विश्लेषण अनुपलब्ध है।',
    errorSelectVehicle: 'विश्लेषण से पहले कृपया एक वास्तविक वाहन चुनें।',
    errorAnalysisFailed: 'वाहन विश्लेषण विफल रहा। कृपया बैकएंड सेवा जांचें।',
    reportSuccess: 'वाहन स्वास्थ्य रिपोर्ट पीडीएफ सफलतापूर्वक तैयार की गई!',
  },

  mr: {
    brandTitle: 'स्मार्ट व्हेईकल',
    brandSubtitle: 'हेल्थ इंटेलिजन्स',
    workspace: 'कार्यक्षेत्र',
    dashboard: 'डॅशबोर्ड',
    vehicles: 'वाहनांची यादी',
    newAnalysis: 'नवीन विश्लेषण',
    predictionHistory: 'अंदाज इतिहास',
    vehicleHealth: 'वाहन आरोग्य',
    shapAnalysis: 'SHAP विश्लेषण',
    recommendations: 'शिफारसी',
    modelInfo: 'मॉडेल माहिती',
    datasetInfo: 'डेटासेट माहिती',
    systemStatus: 'प्रणाली स्थिती',
    aiModelActive: 'सक्रिय',
    systemHealthy: 'सुरळीत',

    searchPlaceholder: 'वाहन आयडी शोधा...',
    themeToggleDark: 'लाइट मोड वर बदला',
    themeToggleLight: 'डार्क मोड वर बदला',
    languageSelect: 'भाषा',

    heroEyebrow: 'मॉडेल-आधारित वाहन विश्लेषण',
    heroHeadingPrefix: 'दुरुस्तीपूर्वीच जाणून घ्या',
    heroHeadingSuffix: 'कोणत्या वाहनाला लक्ष हवे आहे.',
    heroSubheading: 'तुमच्या वाहन डेटासेटमधून देखभाल अंदाज, आरोग्य स्कोअर आणि SHAP स्पष्टीकरण.',
    modelBadgeTitle: 'रँडम फॉरेस्ट',
    modelBadgeSubtitle: 'उत्पादन मॉडेल · सेव्ह केलेले आर्टिफॅक्ट',

    totalVehicles: 'एकूण वाहने',
    totalVehiclesMeta: 'डेटासेट नोंदी',
    maintenanceRequired: 'देखभाल आवश्यक',
    maintenanceRequiredMeta: 'मॉडेल अंदाज',
    avgHealthScore: 'सरासरी आरोग्य स्कोअर',
    avgHealthScoreMeta: '१०० पैकी',
    modelType: 'एमएल मॉडेल',
    modelTypeMeta: 'निवडलेले क्लासिफायर',

    fleetRegisterTitle: 'फ्लीट आरोग्य नोंदवही',
    fleetRegisterSubtitle: 'वाहन डेटासेट तपशील',
    colVehicleId: 'वाहन आयडी',
    colModel: 'मॉडेल',
    colPrediction: 'अंदाज',
    colProbability: 'संभाव्यता',
    colHealthScore: 'आरोग्य स्कोअर',
    colStatus: 'स्थिती',
    colActions: 'क्रिया',
    viewDetails: 'पहा',
    downloadReport: 'पीडीएफ अहवाल',

    healthDistributionTitle: 'आरोग्य वितरण',
    riskProfile: 'जोखीम प्रोफाइल',
    avgScore: 'सरासरी स्कोअर',
    excellent: 'उत्कृष्ट',
    good: 'चांगले',
    fair: 'मध्यम',
    poor: 'असमाधानकारक',
    critical: 'गंभीर',

    analysisPipeline: 'विश्लेषण प्रक्रिया',

    newAnalysisEyebrow: 'नवीन वाहन विश्लेषण',
    newAnalysisTitle: 'खरे वाहन डेटासेट रेकॉर्ड निवडा',
    newAnalysisSubtitle: 'तपशील तपासा आणि मूळ वैशिष्ट्यांवर मॉडेल चालवा.',
    searchVehicleHint: 'वाहन आयडी टाका (उदा. FFV2-000001)...',
    selectPrompt: 'अंदाजासाठी खालील यादीतून वाहन निवडा',
    btnAnalyze: 'वाहन विश्लेषण करा',
    btnAnalyzing: 'विश्लेषण चालू आहे...',
    noVehicleSelected: 'कृपया प्रथम एक वाहन रेकॉर्ड निवडा.',

    predictionOutcome: 'अंदाज',
    needsMaintenance: 'देखभाल आवश्यक',
    noMaintenance: 'देखभालीची गरज नाही',
    failureProbability: 'बिघाड संभाव्यता',
    healthScoreLabel: 'आरोग्य स्कोअर',
    statusLabel: 'आरोग्य स्थिती',
    topShapFactors: 'प्रमुख SHAP घटक',
    whyThisPrediction: 'हा अंदाज का?',
    savedRecommendations: 'शिफारस केलेली देखभाल',
    suggestedMaintenance: 'सुचवलेली कृती',
    noSavedRecommendations: 'या वाहनासाठी कोणतीही सेव्ह केलेली शिफारस नाही.',
    downloadPdfButton: 'आरोग्य अहवाल डाउनलोड करा (PDF)',

    historyTitle: 'अंदाज इतिहास',
    historySubtitle: 'मागील एआय निदानाचा इतिहास',
    historyEmpty: 'अद्याप कोणतेही अंदाज नोंदवले गेले नाहीत. येथे इतिहास पाहण्यासाठी वाहन विश्लेषण चालवा.',
    historyDate: 'वेळ',
    refreshHistory: 'इतिहास रीफ्रेश करा',

    errorFetchSummary: 'विश्लेषण सेवा उपलब्ध नाही. कृपया FastAPI चालू असल्याची खात्री करा.',
    errorFetchShap: 'SHAP विश्लेषण उपलब्ध नाही.',
    errorSelectVehicle: 'विश्लेषण करण्यापूर्वी कृपया खरे वाहन रेकॉर्ड निवडा.',
    errorAnalysisFailed: 'वाहन विश्लेषण अयशस्वी झाले. कृपया बॅकएंड तपासा.',
    reportSuccess: 'वाहन आरोग्य अहवाल पीडीएफ यशस्वीरित्या तयार झाला!',
  },
};
