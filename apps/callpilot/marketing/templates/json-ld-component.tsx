/**
 * JSON-LD Component - Minimal starter template
 *
 * Injects structured data (Schema.org) into the page.
 *
 * Usage:
 *   <JsonLd data={{
 *     "@context": "https://schema.org",
 *     "@type": "Organization",
 *     "name": "Your Company",
 *     "url": "https://example.com"
 *   }} />
 *
 * See STRUCTURED-DATA.md for schema examples by vertical.
 */

interface JsonLdProps {
  /** Schema.org structured data object */
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

/**
 * Helper: Organization schema for homepage
 */
export function OrganizationSchema({
  name,
  url,
  logo,
  sameAs = [],
}: {
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name,
        url,
        ...(logo && { logo }),
        ...(sameAs.length > 0 && { sameAs }),
      }}
    />
  );
}

/**
 * Helper: Breadcrumb schema
 */
export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

/**
 * Helper: FAQ schema
 */
export function FAQSchema({
  questions,
}: {
  questions: { question: string; answer: string }[];
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: questions.map((q) => ({
          '@type': 'Question',
          name: q.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: q.answer,
          },
        })),
      }}
    />
  );
}
