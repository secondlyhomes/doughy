// src/features/real-estate/components/wizard-form-constants.ts
// Initial data constants for PropertyFormWizard steps

import { Step1Data } from './PropertyFormStep1';
import { Step2Data } from './PropertyFormStep2';
import { Step3Data } from './PropertyFormStep3';
import { Step4Data } from './PropertyFormStep4';
import { Step5Data } from './PropertyFormStep5';

export const initialStep1Data: Step1Data = {
  address: '',
  address_line_2: '',
  city: '',
  state: '',
  zip: '',
  county: '',
  propertyType: 'single_family',
};

export const initialStep2Data: Step2Data = {
  bedrooms: '',
  bathrooms: '',
  square_feet: '',
  lot_size: '',
  year_built: '',
};

export const initialStep3Data: Step3Data = {
  arv: '',
  purchase_price: '',
  repair_cost: '',
};

export const initialStep4Data: Step4Data = {
  images: [],
};

export const initialStep5Data: Step5Data = {
  notes: '',
};
