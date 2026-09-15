export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'ta';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Brand & General
    app_name: 'BhoomiAI',
    app_subtitle: 'Land Record Intelligence',
    select_language: 'Select Language',
    jurisdiction: 'Jurisdiction',
    active_state: 'Active State',
    live_workspace: 'Live Workspace',
    platform_active: 'BhoomiAI Platform Active',

    // Navigation
    home: 'Home',
    how_it_works: 'How It Works',
    features: 'Features',
    about: 'About',
    citizen_portal: 'Citizen Portal',
    authority_portal: 'Authority Portal',
    switch_to_authority: 'Switch to Authority',
    switch_to_citizen: 'Switch to Citizen',

    // Citizen Portal Nav
    dashboard: 'Dashboard',
    my_land: 'My Land',
    upload_documents: 'Upload Documents',
    my_documents: 'My Documents',
    reconciliation: 'Reconciliation',
    evidence_viewer: 'Evidence Viewer',

    // Authority Portal Nav
    command_center: 'Command Center',
    document_repository: 'Document Repository',
    verification_queue: 'Verification Queue',
    cadastral_gis: 'Cadastral GIS',
    access_requests: 'Access Requests',

    // Verification Queue & Cases
    authority_verification_queue: 'Authority Verification Queue',
    case_id: 'Case ID',
    citizen_id: 'Citizen / Submission ID',
    documents: 'Documents',
    conflicts: 'Conflicts',
    risk: 'Risk',
    status: 'Status',
    created: 'Created',
    assigned_officer: 'Assigned Officer',
    action: 'Action',
    view_details: 'View Details',
    view_docs: 'View Documents',
    attached_documents: 'Attached Documents',
    no_documents_found: 'No documents attached to this case.',
    close: 'Close',
    preview_file: 'Preview File',
    view_in_evidence_viewer: 'View in Evidence Viewer',
    inspect_ocr: 'Inspect OCR',

    // Filters
    search_cases: 'Search cases by ID, name, Gat/Survey No...',
    all_states: 'All States',
    all_districts: 'All Districts',
    all_talukas: 'All Talukas',
    all_villages: 'All Villages',
    all_doc_types: 'All Document Types',
    all_risks: 'All Risk Levels',
    all_statuses: 'All Statuses',
    clear_filters: 'Clear Filters',

    // Risk levels
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',

    // Statuses
    PENDING_AUTHORITY_REVIEW: 'Pending Review',
    UNDER_VERIFICATION: 'Under Verification',
    NEEDS_CITIZEN_INPUT: 'Needs Citizen Input',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    ESCALATED: 'Escalated',

    // Document Types
    sale_deed: 'Sale Deed',
    extract_7_12: '7/12 Extract',
    mutation_entry: 'Ferfar Mutation Entry',
    khatauni: 'Khatauni',
    rtc_pahani: 'RTC Pahani',
  },
  hi: {
    // Brand & General
    app_name: 'भूमिAI',
    app_subtitle: 'भूमि अभिलेख बुद्धिमत्ता',
    select_language: 'भाषा चुनें',
    jurisdiction: 'क्षेत्राधिकार',
    active_state: 'सक्रिय राज्य',
    live_workspace: 'लाइव कार्यस्थान',
    platform_active: 'भूमिAI प्लेटफॉर्म सक्रिय',

    // Navigation
    home: 'मुख्य पृष्ठ',
    how_it_works: 'यह कैसे काम करता है',
    features: 'विशेषताएं',
    about: 'हमारे बारे में',
    citizen_portal: 'नागरिक पोर्टल',
    authority_portal: 'प्राधिकरण पोर्टल',
    switch_to_authority: 'प्राधिकरण पोर्टल पर जाएं',
    switch_to_citizen: 'नागरिक पोर्टल पर जाएं',

    // Citizen Portal Nav
    dashboard: 'डैशबोर्ड',
    my_land: 'मेरी भूमि',
    upload_documents: 'दस्तावेज़ अपलोड करें',
    my_documents: 'मेरे दस्तावेज़',
    reconciliation: 'सुलह और मिलान',
    evidence_viewer: 'साक्ष्य दर्शक',

    // Authority Portal Nav
    command_center: 'कमांड सेंटर',
    document_repository: 'दस्तावेज़ कोष',
    verification_queue: 'सत्यापन कतार',
    cadastral_gis: 'भू-मानचित्र जीआईएस',
    access_requests: 'पहुंच अनुरोध',

    // Verification Queue & Cases
    authority_verification_queue: 'प्राधिकरण सत्यापन कतार',
    case_id: 'मामला आईडी',
    citizen_id: 'नागरिक / आवेदन आईडी',
    documents: 'दस्तावेज़',
    conflicts: 'विसंगतियाँ',
    risk: 'जोखिम स्तर',
    status: 'स्थिति',
    created: 'दिनांक',
    assigned_officer: 'आवंटित अधिकारी',
    action: 'कार्रवाई',
    view_details: 'विवरण देखें',
    view_docs: 'दस्तावेज़ देखें',
    attached_documents: 'संलग्न दस्तावेज़',
    no_documents_found: 'इस मामले से कोई दस्तावेज़ संलग्न नहीं है।',
    close: 'बंद करें',
    preview_file: 'फाइल पूर्वावलोकन',
    view_in_evidence_viewer: 'साक्ष्य दर्शक में देखें',
    inspect_ocr: 'ओसीआर जांचें',

    // Filters
    search_cases: 'मामला आईडी, नाम, गट/सर्वे नंबर द्वारा खोजें...',
    all_states: 'सभी राज्य',
    all_districts: 'सभी जिले',
    all_talukas: 'सभी तालुका',
    all_villages: 'सभी गांव',
    all_doc_types: 'सभी दस्तावेज़ प्रकार',
    all_risks: 'सभी जोखिम स्तर',
    all_statuses: 'सभी स्थितियाँ',
    clear_filters: 'फ़िल्टर साफ़ करें',

    // Risk levels
    CRITICAL: 'गंभीर (Critical)',
    HIGH: 'उच्च (High)',
    MEDIUM: 'मध्यम (Medium)',
    LOW: 'निम्न (Low)',

    // Statuses
    PENDING_AUTHORITY_REVIEW: 'सत्यापन लंबित',
    UNDER_VERIFICATION: 'सत्यापनाधीन',
    NEEDS_CITIZEN_INPUT: 'नागरिक इनपुट आवश्यक',
    APPROVED: 'स्वीकृत',
    REJECTED: 'अस्वीकृत',
    ESCALATED: 'उच्चाधिकारी को प्रेषित',

    // Document Types
    sale_deed: 'विक्रय विलेख (Sale Deed)',
    extract_7_12: '7/12 विवरण (Extract)',
    mutation_entry: 'नामांतरण प्रविष्टि (Mutation)',
    khatauni: 'खतौनी (Khatauni)',
    rtc_pahani: 'आरटीसी पहानी (RTC)',
  },
  mr: {
    // Brand & General
    app_name: 'भूमीAI',
    app_subtitle: 'जमीन महसूल माहिती प्रणाली',
    select_language: 'भाषा निवडा',
    jurisdiction: 'जिल्हा / अधिकारक्षेत्र',
    active_state: 'सक्रिय राज्य',
    live_workspace: 'थेट कार्यस्थान',
    platform_active: 'भूमीAI प्लॅटफॉर्म कार्यरत',

    // Navigation
    home: 'मुख्य पृष्ठ',
    how_it_works: 'कार्यपद्धती',
    features: 'वैशिष्ट्ये',
    about: 'माहिती',
    citizen_portal: 'नागरिक पोर्टल',
    authority_portal: 'महसूल अधिकारी पोर्टल',
    switch_to_authority: 'अधिकारी पोर्टलवर जा',
    switch_to_citizen: 'नागरिक पोर्टलवर जा',

    // Citizen Portal Nav
    dashboard: 'डॅशबोर्ड',
    my_land: 'माझी जमीन',
    upload_documents: 'कागदपत्रे अपलोड करा',
    my_documents: 'माझी कागदपत्रे',
    reconciliation: 'तुलना व जुळवाजुळव',
    evidence_viewer: 'पुरावा दर्शक',

    // Authority Portal Nav
    command_center: 'नियंत्रण कक्ष',
    document_repository: 'कागदपत्र संग्रह',
    verification_queue: 'तपासणी रांग (Queue)',
    cadastral_gis: 'भू-नकाशा जीआयएस',
    access_requests: 'अर्ज व विनंत्या',

    // Verification Queue & Cases
    authority_verification_queue: 'महसूल अधिकारी तपासणी रांग',
    case_id: 'प्रकरण क्रमांक',
    citizen_id: 'नागरिक / अर्ज क्रमांक',
    documents: 'कागदपत्रे',
    conflicts: 'फरक / त्रुटी',
    risk: 'धोका पातळी',
    status: 'सद्यस्थिती',
    created: 'दिनांक',
    assigned_officer: 'नियुक्त अधिकारी',
    action: 'कारवाई',
    view_details: 'तपशील पहा',
    view_docs: 'कागदपत्रे पहा',
    attached_documents: 'जोडलेली कागदपत्रे',
    no_documents_found: 'या प्रकरणाशी कोणतीही कागदपत्रे जोडलेली नाहीत.',
    close: 'बंद करा',
    preview_file: 'फाइल पूर्वावलोकन',
    view_in_evidence_viewer: 'पुरावा दर्शकात पहा',
    inspect_ocr: 'ओसीआर तपशील',

    // Filters
    search_cases: 'प्रकरण क्र., नाव, गट/सर्व्हे नंबरने शोधा...',
    all_states: 'सर्व राज्ये',
    all_districts: 'सर्व जिल्हे',
    all_talukas: 'सर्व तालुके',
    all_villages: 'सर्व गावे',
    all_doc_types: 'सर्व कागदपत्र प्रकार',
    all_risks: 'सर्व धोका पातळी',
    all_statuses: 'सर्व स्थिती',
    clear_filters: 'फिल्टर काढून टाका',

    // Risk levels
    CRITICAL: 'अति-गंभीर (Critical)',
    HIGH: 'उच्च (High)',
    MEDIUM: 'मध्यम (Medium)',
    LOW: 'कमी (Low)',

    // Statuses
    PENDING_AUTHORITY_REVIEW: 'तपासणी प्रलंबित',
    UNDER_VERIFICATION: 'तपासणी सुरू',
    NEEDS_CITIZEN_INPUT: 'नागरिक माहिती आवश्यक',
    APPROVED: 'मंजूर',
    REJECTED: 'नाकारले',
    ESCALATED: 'वरिष्ठांकडे वर्ग',

    // Document Types
    sale_deed: 'खरेदीखत (Sale Deed)',
    extract_7_12: '७/१२ उतारा',
    mutation_entry: 'फेरफार नोंद (Mutation)',
    khatauni: 'खातेपुस्तक (Khatauni)',
    rtc_pahani: 'पहाणी उतारा (RTC)',
  },
  ta: {
    // Brand & General
    app_name: 'பூமிAI',
    app_subtitle: 'நில பதிவு நுண்ணறிவு',
    select_language: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    jurisdiction: 'அதிகார வரம்பு',
    active_state: 'செயலில் உள்ள மாநிலம்',
    live_workspace: 'நேரலை பணியிடம்',
    platform_active: 'பூமிAI தளம் செயலில் உள்ளது',

    // Navigation
    home: 'முகப்பு',
    how_it_works: 'செயல்படும் முறை',
    features: 'அம்சங்கள்',
    about: 'எங்களைப் பற்றி',
    citizen_portal: 'குடிமக்கள் தளம்',
    authority_portal: 'அதிகாரிகள் தளம்',
    switch_to_authority: 'அதிகாரிகள் தளத்திற்கு மாறவும்',
    switch_to_citizen: 'குடிமக்கள் தளத்திற்கு மாறவும்',

    // Citizen Portal Nav
    dashboard: 'டாஷ்போர்டு',
    my_land: 'என் நிலம்',
    upload_documents: 'ஆவணங்களைப் பதிவேற்றவும்',
    my_documents: 'என் ஆவணங்கள்',
    reconciliation: 'ஒப்பீடு மற்றும் சரிபார்ப்பு',
    evidence_viewer: 'சான்று பார்வையாளர்',

    // Authority Portal Nav
    command_center: 'கட்டளை மையம்',
    document_repository: 'ஆவணக் களஞ்சியம்',
    verification_queue: 'சரிபார்ப்பு வரிசை',
    cadastral_gis: 'நிலவரைபட ஜி.ஐ.எஸ்',
    access_requests: 'அணுகல் கோரிக்கைகள்',

    // Verification Queue & Cases
    authority_verification_queue: 'அதிகாரிகள் சரிபார்ப்பு வரிசை',
    case_id: 'வழக்கு எண்',
    citizen_id: 'குடிமகன் / விண்ணப்ப எண்',
    documents: 'ஆவணங்கள்',
    conflicts: 'முரண்பாடுகள்',
    risk: 'அபாய நிலை',
    status: 'நிலை',
    created: 'தேதி',
    assigned_officer: 'ஒதுக்கப்பட்ட அதிகாரி',
    action: 'நடவடிக்கை',
    view_details: 'விவரங்களைப் பார்க்கவும்',
    view_docs: 'ஆவணங்களைப் பார்க்கவும்',
    attached_documents: 'இணைக்கப்பட்ட ஆவணங்கள்',
    no_documents_found: 'இந்த வழக்கில் எந்த ஆவணங்களும் இணைக்கப்படவில்லை.',
    close: 'மூடு',
    preview_file: 'கோப்பு முன்னோட்டம்',
    view_in_evidence_viewer: 'சான்று பார்வையாளரில் பார்க்கவும்',
    inspect_ocr: 'ஓ.சி.ஆர் ஆய்வு',

    // Filters
    search_cases: 'வழக்கு எண், பெயர், சர்வே எண் மூலம் தேடவும்...',
    all_states: 'எல்லா மாநிலங்களும்',
    all_districts: 'எல்லா மாவட்டங்களும்',
    all_talukas: 'எல்லா தாலுகாக்களும்',
    all_villages: 'எல்லா கிராமங்களும்',
    all_doc_types: 'எல்லா ஆவண வகைகளும்',
    all_risks: 'எல்லா அபாய நிலைகளும்',
    all_statuses: 'எல்லா நிலைகளும்',
    clear_filters: 'வடிகட்டிகளை நீக்கு',

    // Risk levels
    CRITICAL: 'மிகவும் ஆபத்தானது (Critical)',
    HIGH: 'அதிகம் (High)',
    MEDIUM: 'மிதமான (Medium)',
    LOW: 'குறைந்த (Low)',

    // Statuses
    PENDING_AUTHORITY_REVIEW: 'சரிபார்ப்பு நிலுவையில் உள்ளது',
    UNDER_VERIFICATION: 'சரிபார்க்கப்படுகிறது',
    NEEDS_CITIZEN_INPUT: 'குடிமகன் விவரம் தேவை',
    APPROVED: 'அங்கீகரிக்கப்பட்டது',
    REJECTED: 'நிராகரிக்கப்பட்டது',
    ESCALATED: 'மேலதிகாரிக்கு அனுப்பப்பட்டது',

    // Document Types
    sale_deed: 'கிரயப் பத்திரம் (Sale Deed)',
    extract_7_12: 'பட்டா / சிட்டா',
    mutation_entry: 'பட்டா மாறுதல் (Mutation)',
    khatauni: 'கதௌனி (Khatauni)',
    rtc_pahani: 'ஆர்.டி.சி (RTC)',
  },
};
