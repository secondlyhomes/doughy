// src/features/real-estate/components/index.ts

export { PropertyCard } from './PropertyCard';
export { PropertyImagePicker } from './PropertyImagePicker';
export { PropertyForm } from './PropertyForm';
export { PropertyMap } from './PropertyMap';
export { PropertyLocationMap } from './PropertyLocationMap';
export { AddressAutocomplete } from './AddressAutocomplete';
export type { AddressResult } from './AddressAutocomplete';
export { PropertyAnalytics } from './PropertyAnalytics';
export type { PropertyAnalyticsProps } from './PropertyAnalytics';
export { PropertyFiltersSheet } from './PropertyFiltersSheet';
export { PropertySortSheet } from './PropertySortSheet';

// Property Detail Components
export { PropertyHeader } from './PropertyHeader';
export { PropertyQuickStats } from './PropertyQuickStats';
export { PropertyOverviewTab } from './PropertyOverviewTab';
export { PropertyAnalysisTab } from './PropertyAnalysisTab';
export { PropertyCompsTab } from './PropertyCompsTab';
export { PropertyFinancingTab } from './PropertyFinancingTab';
export { PropertyRepairsTab } from './PropertyRepairsTab';
export { PropertyDocsTab } from './PropertyDocsTab';

// Form Wizard Components
export { PropertyFormWizard } from './PropertyFormWizard';
export { FormStepProgress, PROPERTY_FORM_STEPS } from './FormStepProgress';
export type { FormStep } from './FormStepProgress';
export { PropertyFormStep1 } from './PropertyFormStep1';
export type { Step1Data } from './PropertyFormStep1';
export { PropertyFormStep2 } from './PropertyFormStep2';
export type { Step2Data } from './PropertyFormStep2';
export { PropertyFormStep3 } from './PropertyFormStep3';
export type { Step3Data } from './PropertyFormStep3';

// Comps Components
export { CompCard } from './CompCard';
export { AddCompSheet } from './AddCompSheet';
export { ARVCalculator } from './ARVCalculator';

// Analysis Components
export { CashFlowAnalysis } from './CashFlowAnalysis';

// Repair Components
export { AddRepairSheet } from './AddRepairSheet';

// Financing Components
export { AddFinancingSheet } from './AddFinancingSheet';

// Document Components
export { UploadDocumentSheet } from './UploadDocumentSheet';

// Property Actions Components
export { PropertyActionsSheet } from './PropertyActionsSheet';

// Related Deals Components
export { RelatedDealsCard } from './RelatedDealsCard';
