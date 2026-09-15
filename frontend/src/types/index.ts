export type IndianState =
  | 'Maharashtra'
  | 'Karnataka'
  | 'Telangana'
  | 'Uttar Pradesh'
  | 'Madhya Pradesh'
  | 'Rajasthan'
  | 'Gujarat'
  | 'Bihar'
  | 'West Bengal'
  | 'Tamil Nadu'
  | 'Kerala'
  | 'Andhra Pradesh'
  | 'Odisha'
  | 'Punjab'
  | 'Haryana'
  | 'Other';

export interface StateRecordMetadata {
  state: IndianState;
  commonDocuments: string[];
  primaryLanguages: string[];
  landMeasurementUnits: string[];
}

export const INDIAN_STATES_LIST: IndianState[] = [
  'Maharashtra',
  'Karnataka',
  'Telangana',
  'Uttar Pradesh',
  'Madhya Pradesh',
  'Rajasthan',
  'Gujarat',
  'Bihar',
  'West Bengal',
  'Tamil Nadu',
  'Kerala',
  'Andhra Pradesh',
  'Odisha',
  'Punjab',
  'Haryana',
  'Other',
];

export const STATE_METADATA_MAP: Record<IndianState, StateRecordMetadata> = {
  Maharashtra: {
    state: 'Maharashtra',
    commonDocuments: ['7/12 Extract (Saat-Baara)', '8A Holding Extract', 'Ferfar (Mutation Entry)', 'Registered Sale Deed'],
    primaryLanguages: ['Marathi', 'English'],
    landMeasurementUnits: ['Hectare', 'Are', 'Guntha', 'Sq. Meter'],
  },
  Karnataka: {
    state: 'Karnataka',
    commonDocuments: ['RTC (Pahani)', 'Mutation Register (MR)', 'Form 9 & 11', 'Registered Sale Deed'],
    primaryLanguages: ['Kannada', 'English'],
    landMeasurementUnits: ['Acre', 'Gunta', 'Sq. Feet'],
  },
  Telangana: {
    state: 'Telangana',
    commonDocuments: ['Dharani Passbook', 'Pahani Extract', 'ROR 1-B', 'Registered Sale Deed'],
    primaryLanguages: ['Telugu', 'English'],
    landMeasurementUnits: ['Acre', 'Gunta', 'Sq. Yard'],
  },
  'Uttar Pradesh': {
    state: 'Uttar Pradesh',
    commonDocuments: ['Khatauni (RoR)', 'Khasra Map/Record', 'Bhulekh Parwana', 'Registered Sale Deed'],
    primaryLanguages: ['Hindi', 'English'],
    landMeasurementUnits: ['Bigha', 'Biswa', 'Hectare', 'Sq. Meter'],
  },
  'Madhya Pradesh': {
    state: 'Madhya Pradesh',
    commonDocuments: ['Khasra Khatoni', 'Bhoo-Adhikar Pustika', 'Mutation Order', 'Registered Sale Deed'],
    primaryLanguages: ['Hindi', 'English'],
    landMeasurementUnits: ['Bigha', 'Hectare', 'Acre'],
  },
  Rajasthan: {
    state: 'Rajasthan',
    commonDocuments: ['Jamabandi (Apna Khata)', 'Khasra Girdawari', 'Namantaran', 'Registered Sale Deed'],
    primaryLanguages: ['Hindi', 'English'],
    landMeasurementUnits: ['Bigha', 'Biswa', 'Hectare', 'Acre'],
  },
  Gujarat: {
    state: 'Gujarat',
    commonDocuments: ['AnyRoR Village Form 7', 'Village Form 8A', 'Village Form 6 (Hakk Patrak)', 'Registered Sale Deed'],
    primaryLanguages: ['Gujarati', 'English'],
    landMeasurementUnits: ['Vigha', 'Guntha', 'Sq. Meter'],
  },
  Bihar: {
    state: 'Bihar',
    commonDocuments: ['Dakhil Kharij Receipt', 'Khatian', 'LPC (Land Possession Certificate)', 'Registered Sale Deed'],
    primaryLanguages: ['Hindi', 'English'],
    landMeasurementUnits: ['Bigha', 'Katha', 'Dhur'],
  },
  'West Bengal': {
    state: 'West Bengal',
    commonDocuments: ['Banglarbhumi Khatian', 'Plot Info (LR/RS)', 'Porcha Extract', 'Registered Sale Deed'],
    primaryLanguages: ['Bengali', 'English'],
    landMeasurementUnits: ['Decimal', 'Katha', 'Bigha'],
  },
  'Tamil Nadu': {
    state: 'Tamil Nadu',
    commonDocuments: ['Patta Chitta', 'TSLR Extract', 'A-Register', 'Registered Sale Deed'],
    primaryLanguages: ['Tamil', 'English'],
    landMeasurementUnits: ['Cent', 'Ground', 'Acre', 'Sq. Feet'],
  },
  Kerala: {
    state: 'Kerala',
    commonDocuments: ['Thandaper Register (RoR)', 'Bhoomi Pokkuvaravu', 'Field Measurement Book (FMB)', 'Registered Sale Deed'],
    primaryLanguages: ['Malayalam', 'English'],
    landMeasurementUnits: ['Cent', 'Acre', 'Sq. Meter'],
  },
  'Andhra Pradesh': {
    state: 'Andhra Pradesh',
    commonDocuments: ['Meebhoomi Adangal', '1-B Namuna', 'Pattadar Passbook', 'Registered Sale Deed'],
    primaryLanguages: ['Telugu', 'English'],
    landMeasurementUnits: ['Acre', 'Cent', 'Sq. Yard'],
  },
  Odisha: {
    state: 'Odisha',
    commonDocuments: ['Bhulekh RoR', 'Mutation Parcha', 'Sabik-Hal Map', 'Registered Sale Deed'],
    primaryLanguages: ['Odia', 'English'],
    landMeasurementUnits: ['Acre', 'Decimal', 'Goonth'],
  },
  Punjab: {
    state: 'Punjab',
    commonDocuments: ['Jamabandi (PLRS)', 'Intiqal (Mutation)', 'Khasra Girdawari', 'Registered Sale Deed'],
    primaryLanguages: ['Punjabi', 'English'],
    landMeasurementUnits: ['Kanal', 'Marla', 'Killa', 'Acre'],
  },
  Haryana: {
    state: 'Haryana',
    commonDocuments: ['Jamabandi (Jamabandi.nic.in)', 'Intkal', 'Khasra Girdawari', 'Registered Sale Deed'],
    primaryLanguages: ['Hindi', 'English'],
    landMeasurementUnits: ['Kanal', 'Marla', 'Killa', 'Sq. Yard'],
  },
  Other: {
    state: 'Other',
    commonDocuments: ['Record of Rights (RoR)', 'Title Deed / Patta', 'Mutation Entry', 'Registered Sale Deed'],
    primaryLanguages: ['Hindi', 'English'],
    landMeasurementUnits: ['Acre', 'Hectare', 'Sq. Meter'],
  },
};
