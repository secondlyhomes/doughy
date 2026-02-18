# Structured Data (Schema.org)

Structured data tells search engines exactly what your pages are. Instead of Google guessing "this page seems to be about a product," you explicitly tell it the name, price, availability, and reviews.

## Why It Matters

- **Rich results**: Price, ratings, and images appear directly in search results
- **AI understanding**: ChatGPT and Perplexity use schema to cite your content accurately
- **Knowledge panels**: Organization schema can trigger knowledge panels for your brand
- **Voice search**: Structured data helps voice assistants answer queries about your business

## Implementation

Use JSON-LD format (Google's recommendation) injected via a React component:

```tsx
// src/components/JsonLd.tsx
interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

## Industry-Specific Schemas

> **See [examples/](../examples/)** for complete schema templates by vertical:
> - **E-Commerce**: Product, Offer, AggregateRating
> - **SaaS**: WebApplication, SoftwareApplication
> - **Local Business**: LocalBusiness subtypes (Restaurant, LegalService, etc.)
> - **Professional Services**: ProfessionalService, Service, OfferCatalog

## Universal Schemas (Add to Every Site)

### Organization (Homepage)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "[BUSINESS-NAME]",
  "url": "https://[YOUR-DOMAIN].com",
  "logo": "https://[YOUR-DOMAIN].com/logo.png",
  "sameAs": [
    "https://twitter.com/[HANDLE]",
    "https://linkedin.com/company/[COMPANY]",
    "https://facebook.com/[PAGE]"
  ]
}
```

### BreadcrumbList (All Pages)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://[YOUR-DOMAIN].com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Products",
      "item": "https://[YOUR-DOMAIN].com/products"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "[PRODUCT-NAME]",
      "item": "https://[YOUR-DOMAIN].com/products/[SLUG]"
    }
  ]
}
```

### FAQPage (FAQ Sections)

> **Important**: Since August 2023, Google restricts FAQ rich results to **government and health websites only**. However, FAQPage schema still helps AI search - pages with FAQ schema are reportedly **3.2x more likely** to appear in Google AI Overviews.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is [YOUR-PRODUCT]?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[ANSWER-TEXT]"
      }
    }
  ]
}
```

While FAQ rich results no longer display for most sites, the structured data still provides value for AI search visibility.

## Validation

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Schema.org Validator**: https://validator.schema.org/

## Free Generators

- https://technicalseo.com/tools/schema-markup-generator/
- https://schemantra.com/
- https://iloveschema.com/

## Resources

- [Schema.org Full Hierarchy](https://schema.org/docs/full.html)
- [Google Structured Data Docs](https://developers.google.com/search/docs/appearance/structured-data)
