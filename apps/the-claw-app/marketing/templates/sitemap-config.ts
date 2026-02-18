/**
 * Sitemap Configuration - Minimal starter template
 *
 * Configuration for vite-plugin-sitemap.
 *
 * Installation:
 *   npm install --save-dev vite-plugin-sitemap
 *
 * Usage in vite.config.ts:
 *   import sitemap from 'vite-plugin-sitemap';
 *   import { sitemapConfig } from './src/config/sitemap-config';
 *
 *   export default defineConfig({
 *     plugins: [react(), sitemap(sitemapConfig)],
 *   });
 */

// TODO: Replace with your domain
const HOSTNAME = 'https://[YOUR-DOMAIN].com';

/**
 * Static routes - add all your app routes here
 */
const staticRoutes = [
  '/',
  '/about',
  '/pricing',
  '/contact',
  '/blog',
  '/faq',
  // Add more routes as needed
];

/**
 * Dynamic routes - fetch at build time
 *
 * Example: Fetch product IDs from database/API
 */
async function getDynamicRoutes(): Promise<string[]> {
  // TODO: Implement if you have dynamic pages
  // Example:
  // const products = await fetch('/api/products').then(r => r.json());
  // return products.map(p => `/products/${p.slug}`);

  return [];
}

/**
 * Sitemap configuration for vite-plugin-sitemap
 */
export const sitemapConfig = {
  hostname: HOSTNAME,

  // Static routes
  dynamicRoutes: staticRoutes,

  // For truly dynamic routes, use a function:
  // dynamicRoutes: async () => {
  //   const dynamic = await getDynamicRoutes();
  //   return [...staticRoutes, ...dynamic];
  // },

  // Exclude patterns (e.g., admin pages)
  exclude: ['/admin/*', '/api/*', '/_*'],

  // Generate robots.txt too
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/admin', '/api'] },
    ],
  },

  // Change frequency hints
  changefreq: 'weekly',

  // Priority hints (0.0 to 1.0)
  priority: 0.7,

  // Last modified (uses build time by default)
  lastmod: new Date(),
};

/**
 * Example: Per-route configuration
 *
 * For more control, you can specify per-route settings:
 */
export const routeConfig = {
  '/': { priority: 1.0, changefreq: 'daily' },
  '/blog': { priority: 0.8, changefreq: 'daily' },
  '/about': { priority: 0.5, changefreq: 'monthly' },
  '/contact': { priority: 0.5, changefreq: 'yearly' },
};
