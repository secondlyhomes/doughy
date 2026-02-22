// src/features/dev/screens/simulate-inquiry/constants.ts
// Platform configurations for simulate inquiry

import type { PlatformConfig } from './types';

export const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    id: 'airbnb',
    name: 'Airbnb',
    icon: '🏠',
    sampleName: 'Sarah Johnson',
    sampleProfession: 'Remote Worker',
    sampleMessage: "Hi! I'm interested in your listing for a 3-month stay. I work remotely as a software developer. Is this available from Feb 1 to Apr 30? I'm quiet and clean, and would love to know more about the WiFi speed.",
    replyMethod: 'email_reply',
  },
  {
    id: 'furnishedfinder',
    name: 'FurnishedFinder',
    icon: '🏥',
    sampleName: 'Emily Martinez',
    sampleProfession: 'Travel Nurse',
    sampleMessage: "Hello! I'm a travel nurse starting a 13-week assignment at Memorial Hospital on February 1st. Looking for furnished housing. I'm quiet, clean, and rarely home during day shifts. Do you accept travel nurse assignments?",
    replyMethod: 'platform_only',
  },
  {
    id: 'turbotenant',
    name: 'TurboTenant',
    icon: '🔑',
    sampleName: 'Michael Chen',
    sampleProfession: 'Corporate Relocator',
    sampleMessage: "I'm relocating to the area for a new job starting in February. Looking for a 6-month lease while I find a permanent home. Is this property pet-friendly? I have a small, well-trained dog.",
    replyMethod: 'direct_email',
  },
  {
    id: 'zillow',
    name: 'Zillow',
    icon: '🏡',
    sampleName: 'Jessica Williams',
    sampleProfession: 'Student',
    sampleMessage: "Hi, I saw your listing and I'm interested! I'm a graduate student at the university nearby. Looking for housing for the spring semester. What's the earliest available move-in date?",
    replyMethod: 'direct_email',
  },
  {
    id: 'craigslist',
    name: 'Craigslist',
    icon: '📋',
    sampleName: 'David Brown',
    sampleProfession: 'Contractor',
    sampleMessage: "Interested in your rental. I'm a contractor working on a project in the area for the next 3 months. Can I schedule a showing this week? What's included in the rent?",
    replyMethod: 'email_reply',
  },
  {
    id: 'direct',
    name: 'Direct Email',
    icon: '✉️',
    sampleName: 'Test Inquiry',
    sampleProfession: 'Other',
    sampleMessage: 'Hello, I found your listing and would like more information. Is this property still available? What are the monthly rates?',
    replyMethod: 'direct_email',
  },
];
