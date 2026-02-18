/**
 * SEO Component - React 19+ with fallback
 *
 * Uses React 19's built-in meta tag hoisting as the primary approach.
 * For React 18 projects, use react-helmet-async instead (see fallback below).
 *
 * Usage:
 *   <SEO title="Page Title" description="Page description" />
 *
 * React 18 Fallback:
 *   npm install react-helmet-async
 *   Wrap app with <HelmetProvider>, then use <SEOLegacy> component below.
 */

interface SEOProps {
  /** Page title (will be appended with site name) */
  title: string;
  /** Page description for search results (150-160 chars ideal) */
  description: string;
  /** Canonical URL (optional, for duplicate content) */
  canonical?: string;
  /** Prevent indexing (default: false) */
  noindex?: boolean;
}

/**
 * React 19+ SEO Component (built-in meta hoisting)
 */
export function SEO({ title, description, canonical, noindex = false }: SEOProps) {
  // TODO: Replace with your site name
  const siteName = '[YOUR-SITE-NAME]';
  const fullTitle = `${title} | ${siteName}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
    </>
  );
}

/**
 * React 18 Fallback using react-helmet-async
 *
 * Installation:
 *   npm install react-helmet-async
 *
 * Setup (in main.tsx):
 *   import { HelmetProvider } from 'react-helmet-async';
 *   <HelmetProvider><App /></HelmetProvider>
 */
// import { Helmet } from 'react-helmet-async';
//
// export function SEOLegacy({ title, description, canonical, noindex = false }: SEOProps) {
//   const siteName = '[YOUR-SITE-NAME]';
//   const fullTitle = `${title} | ${siteName}`;
//
//   return (
//     <Helmet>
//       <title>{fullTitle}</title>
//       <meta name="description" content={description} />
//       {canonical && <link rel="canonical" href={canonical} />}
//       {noindex && <meta name="robots" content="noindex,nofollow" />}
//     </Helmet>
//   );
// }
