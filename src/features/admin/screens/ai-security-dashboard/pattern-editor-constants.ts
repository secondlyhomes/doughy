// src/features/admin/screens/ai-security-dashboard/pattern-editor-constants.ts
// Constants for the pattern editor form

export const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export const THREAT_TYPE_OPTIONS = [
  { value: 'prompt_injection', label: 'Prompt Injection' },
  { value: 'jailbreak', label: 'Jailbreak Attempt' },
  { value: 'data_exfiltration', label: 'Data Exfiltration' },
  { value: 'harmful_content', label: 'Harmful Content' },
  { value: 'abuse', label: 'Abuse/Misuse' },
  { value: 'other', label: 'Other' },
];
