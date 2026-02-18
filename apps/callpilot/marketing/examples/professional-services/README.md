# Professional Services SEO Example

Complete SEO implementation for lawyers, accountants, consultants, and other professional service providers.

## Schema Types

### LegalService (Law Firms)

```json
{
  "@context": "https://schema.org",
  "@type": "LegalService",
  "name": "Smith & Associates Law Firm",
  "description": "Full-service law firm specializing in business law, estate planning, and real estate transactions serving Northern Virginia.",
  "url": "https://smithlaw.com",
  "telephone": "(703) 555-1234",
  "email": "contact@smithlaw.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1000 Wilson Blvd, Suite 500",
    "addressLocality": "Arlington",
    "addressRegion": "VA",
    "postalCode": "22209",
    "addressCountry": "US"
  },
  "areaServed": [
    { "@type": "State", "name": "Virginia" },
    { "@type": "State", "name": "Maryland" },
    { "@type": "State", "name": "District of Columbia" }
  ],
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "opens": "09:00",
    "closes": "18:00"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Legal Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Estate Planning",
          "description": "Wills, trusts, powers of attorney, and estate administration"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Business Law",
          "description": "Formation, contracts, mergers, and compliance"
        }
      }
    ]
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "87"
  }
}
```

### AccountingService (CPAs/Accountants)

```json
{
  "@context": "https://schema.org",
  "@type": "AccountingService",
  "name": "Johnson CPA Group",
  "description": "Tax preparation, bookkeeping, and business advisory services for small businesses and individuals.",
  "url": "https://johnsoncpa.com",
  "telephone": "(703) 555-5678",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "500 N Washington St",
    "addressLocality": "Falls Church",
    "addressRegion": "VA",
    "postalCode": "22046"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Accounting Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Tax Preparation",
          "description": "Individual and business tax returns"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Bookkeeping",
          "description": "Monthly bookkeeping and financial statements"
        }
      }
    ]
  }
}
```

### ProfessionalService (Consultants)

```json
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Strategy Partners Consulting",
  "description": "Management consulting for mid-market companies. Strategy, operations, and digital transformation.",
  "url": "https://strategypartners.com",
  "telephone": "(202) 555-9000",
  "areaServed": "United States",
  "knowsAbout": [
    "Business Strategy",
    "Digital Transformation",
    "Operations Management"
  ]
}
```

### Person (Individual Professional)

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "John Smith",
  "jobTitle": "Attorney at Law",
  "worksFor": {
    "@type": "LegalService",
    "name": "Smith & Associates"
  },
  "url": "https://smithlaw.com/attorneys/john-smith",
  "image": "https://smithlaw.com/images/john-smith.jpg",
  "alumniOf": {
    "@type": "CollegeOrUniversity",
    "name": "Georgetown Law"
  },
  "hasCredential": [
    {
      "@type": "EducationalOccupationalCredential",
      "name": "Virginia State Bar"
    }
  ]
}
```

## Directory Listings

### Legal

| Directory | URL | Notes |
|-----------|-----|-------|
| Justia | lawyers.justia.com | Free, 12M+ monthly visits |
| Avvo | avvo.com | Free starter, Q&A platform |
| Nolo | lawyers.nolo.com | 100K+ monthly requests |
| FindLaw | lawyers.findlaw.com | Established directory |
| Martindale-Hubbell | martindale.com | Peer review ratings |
| Lawyers.com | lawyers.com | Consumer-focused |
| Super Lawyers | superlawyers.com | Invite-only, high authority |

### Accounting

| Directory | URL | Notes |
|-----------|-----|-------|
| CPA Finder | cpafinder.com | CPA-specific |
| TaxBuzz | taxbuzz.com | Verified reviews |
| AICPA Find a CPA | aicpa.org | Official directory |
| Accounting Today | accountingtoday.com | Industry directory |
| QuickBooks ProAdvisor | quickbooks.intuit.com | If certified |

### Consulting

| Directory | URL | Notes |
|-----------|-----|-------|
| Clutch.co | clutch.co | Verified reviews, B2B |
| Management Consulted | managementconsulted.com | Firm directory |
| LinkedIn Company | linkedin.com | Essential for B2B |
| Expertise.com | expertise.com | Local services |

### Universal

| Directory | URL | Notes |
|-----------|-----|-------|
| Google Business Profile | business.google.com | Required |
| Yelp | biz.yelp.com | General reviews |
| Bing Places | bingplaces.com | Voice search |
| BBB | bbb.org | Trust signal |

## Page Structure

### Practice Areas / Services

```
/services/
/services/estate-planning/
/services/business-law/
/services/tax-preparation/
```

### Team Pages

```
/team/
/attorneys/john-smith/
/team/jane-doe/
```

### Location Pages

```
/locations/
/locations/arlington/
/locations/falls-church/
```

### Resources

```
/resources/
/blog/
/faq/
/guides/estate-planning-checklist/
```

## Keyword Strategy

### Service + Location

```
[service] lawyer [city]
[service] attorney near me
[city] [service] firm
best [service] lawyer in [city]
```

### Problem-Based

```
how to [legal/financial problem]
do I need a [service] lawyer
when to hire a [professional type]
cost of [service] in [state]
```

### Specific Services

```
[specific service] [city]
[industry] [service type]
[service] for [audience type]
```

## Content Strategy

### Blog Topics

- Legal/financial guides (evergreen)
- Law changes and updates
- Case studies (anonymized)
- FAQs for common questions
- Industry-specific advice

### Resource Pages

Create comprehensive guides:
- "Complete Guide to Estate Planning in Virginia"
- "Small Business Tax Checklist 2026"
- "What to Expect in a [Practice Area] Case"

### FAQ Schema

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does a will cost in Virginia?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A simple will in Virginia typically costs $300-$500 when prepared by an attorney. Complex estates with trusts may cost $1,000-$3,000+."
      }
    }
  ]
}
```

## SEO Component Example

```tsx
// pages/practice-area.tsx
import { SEO } from '@/components/SEO';
import { SocialMeta } from '@/components/SocialMeta';
import { JsonLd, FAQSchema } from '@/components/JsonLd';

export function PracticeAreaPage({ area }) {
  return (
    <>
      <SEO
        title={`${area.name} Attorney`}
        description={`${area.name} legal services in Northern Virginia. ${area.shortDescription} Free consultation available.`}
      />

      <SocialMeta
        title={`${area.name} Lawyer | Smith & Associates`}
        description={area.shortDescription}
        url={`/services/${area.slug}`}
      />

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'LegalService',
          name: `Smith & Associates - ${area.name}`,
          description: area.description,
          url: `https://smithlaw.com/services/${area.slug}`,
          areaServed: 'Northern Virginia',
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: area.name,
            itemListElement: area.services.map((s) => ({
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: s.name,
                description: s.description,
              },
            })),
          },
        }}
      />

      {area.faqs && <FAQSchema questions={area.faqs} />}

      {/* Page content */}
    </>
  );
}
```

## Review Strategy

### Targets

- 2-4 Google reviews per month
- Maintain 4.5+ average (higher bar for professionals)
- Respond to every review

### When to Ask

- After successful case resolution
- After tax filing completion
- After positive client feedback
- 30 days post-engagement

### Ethical Considerations

- Check bar/licensing rules for your profession
- Never offer incentives for reviews
- Don't ask clients to mention specific services
- Respond professionally to negative reviews

## Trust Signals

### Display on Website

- Bar/license numbers
- Professional association memberships
- Awards and recognitions
- Years in practice
- Education and credentials
- Published articles
- Speaking engagements

### Schema for Credentials

```json
{
  "@type": "Person",
  "hasCredential": [
    {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "license",
      "name": "Virginia State Bar",
      "recognizedBy": {
        "@type": "Organization",
        "name": "Virginia State Bar"
      }
    }
  ]
}
```
