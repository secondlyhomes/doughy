/**
 * Social Meta Component - React 19+ with fallback
 *
 * Adds Open Graph and Twitter Card meta tags for social sharing.
 * Uses React 19's built-in meta tag hoisting as the primary approach.
 *
 * Usage:
 *   <SocialMeta
 *     title="Page Title"
 *     description="Page description"
 *     image="/og-image.jpg"
 *     url="/page-path"
 *   />
 *
 * React 18 Fallback:
 *   npm install react-helmet-async
 *   Wrap app with <HelmetProvider>, then use <SocialMetaLegacy> component below.
 */

interface SocialMetaProps {
  /** Title for social cards (keep under 60 chars) */
  title: string;
  /** Description for social cards (keep under 200 chars) */
  description: string;
  /** Image URL (absolute or relative, 1200x630 recommended) */
  image?: string;
  /** Page URL (absolute or relative) */
  url: string;
  /** Content type */
  type?: 'website' | 'article';
  /** Twitter card type */
  twitterCard?: 'summary' | 'summary_large_image';
}

/**
 * React 19+ Social Meta Component (built-in meta hoisting)
 */
export function SocialMeta({
  title,
  description,
  image = '/default-og-image.jpg',
  url,
  type = 'website',
  twitterCard = 'summary_large_image',
}: SocialMetaProps) {
  // TODO: Replace with your domain
  const siteUrl = 'https://[YOUR-DOMAIN].com';
  const siteName = '[YOUR-SITE-NAME]';
  const twitterHandle = '@[YOUR-HANDLE]';

  // Ensure absolute URLs
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;
  const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;

  return (
    <>
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:site" content={twitterHandle} />
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
// export function SocialMetaLegacy(props: SocialMetaProps) {
//   const { title, description, image = '/default-og-image.jpg', url, type = 'website', twitterCard = 'summary_large_image' } = props;
//   const siteUrl = 'https://[YOUR-DOMAIN].com';
//   const siteName = '[YOUR-SITE-NAME]';
//   const twitterHandle = '@[YOUR-HANDLE]';
//   const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;
//   const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;
//
//   return (
//     <Helmet>
//       <meta property="og:title" content={title} />
//       <meta property="og:description" content={description} />
//       <meta property="og:image" content={fullImageUrl} />
//       <meta property="og:url" content={fullUrl} />
//       <meta property="og:type" content={type} />
//       <meta property="og:site_name" content={siteName} />
//       <meta name="twitter:card" content={twitterCard} />
//       <meta name="twitter:title" content={title} />
//       <meta name="twitter:description" content={description} />
//       <meta name="twitter:image" content={fullImageUrl} />
//       <meta name="twitter:site" content={twitterHandle} />
//     </Helmet>
//   );
// }
