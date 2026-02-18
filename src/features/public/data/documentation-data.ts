// src/features/public/data/documentation-data.ts
// Documentation structure and content

import { getDocContentBySlug } from '@/features/docs/data/documentation-content';

export interface DocPage {
  title: string;
  slug: string;
  seo: string;
}

export interface DocSection {
  section: string;
  icon: string;
  pages: DocPage[];
}

export const documentationData: DocSection[] = [
  {
    section: 'Getting Started',
    icon: 'Home',
    pages: [
      {
        title: 'Introduction',
        slug: 'introduction',
        seo: "Introduction to Doughy's AI-powered real estate investment platform. Learn how our advanced tools help real estate investors analyze properties and convert more leads.",
      },
      {
        title: 'Quick Start Guide',
        slug: 'quick-start',
        seo: "Step-by-step guide to get started quickly with Doughy's real estate investment platform. Set up your account and begin analyzing investment properties in minutes.",
      },
      {
        title: 'Account Setup',
        slug: 'account-setup',
        seo: 'Complete guide to setting up your Doughy account, user profile, and investment team members for optimal real estate deal management.',
      },
      {
        title: 'Dashboard Overview',
        slug: 'dashboard-overview',
        seo: "Understanding Doughy's investment dashboard interface and key metrics to track your property acquisition pipeline and ROI analytics.",
      },
    ],
  },
  {
    section: 'AI-Powered Features',
    icon: 'Zap',
    pages: [
      {
        title: 'OpenAI Models',
        slug: 'openai-models',
        seo: 'How Doughy uses GPT-4.1 models to analyze investment properties, qualify leads, and provide intelligent insights for real estate investors.',
      },
      {
        title: 'Enhanced Transcripts',
        slug: 'enhanced-transcripts',
        seo: 'Using color-coded conversation transcripts to better analyze and track discussions with property sellers, buyers, and investment partners.',
      },
      {
        title: 'Smart Document Analysis',
        slug: 'smart-document-analysis',
        seo: "How Doughy's AI extracts key information from property documents, contracts, and investment agreements to streamline your workflow.",
      },
      {
        title: 'Investment Analysis AI',
        slug: 'investment-analysis-ai',
        seo: 'Leverage artificial intelligence to analyze potential property investments, calculate ROI, and identify optimal exit strategies.',
      },
    ],
  },
  {
    section: 'Lead Management',
    icon: 'FileText',
    pages: [
      {
        title: 'Adding Leads',
        slug: 'adding-leads',
        seo: 'Comprehensive guide to adding and importing investment property seller leads into the Doughy platform through multiple channels including manual entry, CSV import, and integrations.',
      },
      {
        title: 'Lead Qualification',
        slug: 'lead-qualification',
        seo: "How to qualify and prioritize motivated seller leads using Doughy's intelligent scoring system based on property equity, distress signals, and investment potential.",
      },
      {
        title: 'Lead Scoring',
        slug: 'lead-scoring',
        seo: "Detailed explanation of Doughy's AI-powered lead scoring algorithms that help real estate investors identify high-equity and motivated seller opportunities.",
      },
      {
        title: 'CSV Import Guide',
        slug: 'csv-import-guide',
        seo: 'Step-by-step tutorial for importing property owner leads via CSV files, including field mapping for property details and investment criteria.',
      },
    ],
  },
  {
    section: 'Communication',
    icon: 'MessageSquare',
    pages: [
      {
        title: 'Unified Messaging',
        slug: 'unified-messaging',
        seo: 'How to manage all your property seller and buyer communications in one unified inbox, including email, SMS, and call tracking for real estate investment deals.',
      },
      {
        title: 'Email Templates',
        slug: 'email-templates',
        seo: 'Creating high-converting email templates for motivated seller outreach, off-market property offers, and real estate investment partnership communications.',
      },
      {
        title: 'SMS Integration',
        slug: 'sms-integration',
        seo: 'Setting up SMS messaging for real-time communication with distressed property owners, cash buyers, and investment partners for faster deal closing.',
      },
      {
        title: 'Automation Rules',
        slug: 'automation-rules',
        seo: 'Creating automated follow-up sequences and drip campaigns to nurture off-market property leads and maintain buyer relationships for wholesaling and fix-and-flip deals.',
      },
    ],
  },
  {
    section: 'Real Estate Tools',
    icon: 'Home',
    pages: [
      {
        title: 'Property Analysis',
        slug: 'property-analysis',
        seo: "How to use Doughy's property analysis tools to evaluate fix-and-flip opportunities, including accurate ARV calculations, renovation cost estimators, and profit margin projections.",
      },
      {
        title: 'Deal Calculator',
        slug: 'deal-calculator',
        seo: 'Step-by-step guide to calculating cash-on-cash return, cap rates, and BRRRR strategy metrics for single-family homes, multifamily properties, and commercial real estate investments.',
      },
      {
        title: 'Comps Research',
        slug: 'comps-research',
        seo: 'Finding and analyzing comparable properties with AI-powered adjustments to accurately value distressed properties, foreclosures, and off-market real estate investment opportunities.',
      },
      {
        title: 'Document Management',
        slug: 'document-management',
        seo: "Managing purchase agreements, seller disclosures, inspection reports, and closing documents within Doughy's secure real estate document management system.",
      },
    ],
  },
  {
    section: 'Investment Workflows',
    icon: 'PenTool',
    pages: [
      {
        title: 'Fix & Flip Pipeline',
        slug: 'fix-and-flip-pipeline',
        seo: 'Complete workflow for managing fix and flip projects from acquisition to sale, including renovation tracking, contractor management, and timeline automation.',
      },
      {
        title: 'Rental Property Management',
        slug: 'rental-property-management',
        seo: 'Managing rental property investments with tenant screening, lease tracking, maintenance scheduling, and cash flow monitoring tools.',
      },
      {
        title: 'Wholesale Deal Management',
        slug: 'wholesale-deal-management',
        seo: 'Managing your wholesale real estate business with buyer list segmentation, assignment contract tracking, and double-close transaction management.',
      },
      {
        title: 'BRRRR Strategy Implementation',
        slug: 'brrrr-strategy',
        seo: 'Step-by-step workflow for executing the Buy, Rehab, Rent, Refinance, Repeat strategy for building a passive income real estate portfolio.',
      },
    ],
  },
  {
    section: 'Analytics & Reporting',
    icon: 'BarChart2',
    pages: [
      {
        title: 'Investment Performance Dashboard',
        slug: 'performance-dashboard',
        seo: "Understanding your property acquisition metrics, renovation timelines, and investment returns through Doughy's comprehensive real estate analytics dashboard.",
      },
      {
        title: 'Investment Portfolio Reports',
        slug: 'custom-reports',
        seo: 'Creating tailored reports to track property values, cash flow, equity growth, and overall real estate portfolio performance across markets and property types.',
      },
      {
        title: 'Market Analysis Exports',
        slug: 'data-export',
        seo: 'How to export your investment property data for tax preparation, investor presentations, and market analysis for your real estate business.',
      },
      {
        title: 'ROI & Cash Flow Tracking',
        slug: 'roi-tracking',
        seo: 'Track cash-on-cash returns, internal rate of return (IRR), and cap rates across your real estate portfolio to optimize your property acquisition strategy.',
      },
    ],
  },
  {
    section: 'Team & Operations',
    icon: 'Settings',
    pages: [
      {
        title: 'Investment Team Management',
        slug: 'user-management',
        seo: 'Managing real estate acquisition specialists, property managers, renovation contractors, and virtual assistants within your Doughy investment platform.',
      },
      {
        title: 'Role-Based Permissions',
        slug: 'team-permissions',
        seo: 'Setting up access controls to ensure team members have appropriate permissions for property analysis, deal negotiation, and financial data.',
      },
      {
        title: 'Deal Flow Automation',
        slug: 'deal-flow-automation',
        seo: 'Creating automated workflows for property acquisitions, renovation management, and closing processes to streamline your real estate investment operations.',
      },
      {
        title: 'White Labeling',
        slug: 'white-labeling',
        seo: 'Customizing the Doughy platform with your real estate investment brand\'s colors, logo, and domain for investor presentations and client portals.',
      },
    ],
  },
  {
    section: 'Integrations & Data',
    icon: 'Database',
    pages: [
      {
        title: 'Property Data Security',
        slug: 'data-security',
        seo: 'How your investment property data, financial records, and client information is securely protected using enterprise-grade encryption and access controls.',
      },
      {
        title: 'Third-Party Integrations',
        slug: 'api-integrations',
        seo: 'Connecting Doughy with title companies, property management software, accounting systems, and other real estate investment tools through our API.',
      },
      {
        title: 'Compliance & Regulations',
        slug: 'compliance',
        seo: 'Maintaining compliance with real estate disclosure requirements, fair housing regulations, and financial reporting standards for property investments.',
      },
      {
        title: 'Business Continuity',
        slug: 'business-continuity',
        seo: 'How your valuable real estate portfolio data is backed up and protected with disaster recovery systems for business continuity and investor protection.',
      },
    ],
  },
];

// Get all slugs for static generation
export function getAllDocSlugs(): string[] {
  return documentationData.flatMap((section) => section.pages.map((page) => page.slug));
}

// Get page data by slug
export function getDocPageBySlug(slug: string): { section: string; page: DocPage } | null {
  for (const section of documentationData) {
    const page = section.pages.find((p) => p.slug === slug);
    if (page) {
      return { section: section.section, page };
    }
  }
  return null;
}

// Get previous and next pages for navigation
export function getAdjacentPages(
  slug: string
): { prev: DocPage | null; next: DocPage | null } {
  const allPages = documentationData.flatMap((section) => section.pages);
  const currentIndex = allPages.findIndex((page) => page.slug === slug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex > 0 ? allPages[currentIndex - 1] : null,
    next: currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null,
  };
}

// Get documentation content by slug
export function getDocContent(slug: string): string {
  return getDocContentBySlug(slug);
}
