# E-Commerce SEO Example

Complete SEO implementation for online stores and e-commerce businesses.

## Schema Types

### Product Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Premium Wireless Headphones",
  "description": "High-fidelity wireless headphones with active noise cancellation, 30-hour battery life, and premium comfort.",
  "image": [
    "https://example.com/images/headphones-1.jpg",
    "https://example.com/images/headphones-2.jpg"
  ],
  "brand": {
    "@type": "Brand",
    "name": "AudioPro"
  },
  "sku": "AP-WH-500",
  "gtin13": "0123456789012",
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/products/wireless-headphones",
    "priceCurrency": "USD",
    "price": "299.99",
    "availability": "https://schema.org/InStock",
    "priceValidUntil": "2026-12-31",
    "seller": {
      "@type": "Organization",
      "name": "Example Store"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "reviewCount": "1284"
  }
}
```

### Organization Schema (Homepage)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Example Store",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-800-555-1234",
    "contactType": "customer service",
    "availableLanguage": ["English"]
  },
  "sameAs": [
    "https://facebook.com/examplestore",
    "https://instagram.com/examplestore",
    "https://twitter.com/examplestore"
  ]
}
```

### BreadcrumbList Schema

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://example.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Electronics",
      "item": "https://example.com/electronics"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Headphones",
      "item": "https://example.com/electronics/headphones"
    }
  ]
}
```

## Directory Listings

### Marketplaces

| Platform | Commission | Notes |
|----------|------------|-------|
| Amazon | 8-45% | Largest marketplace |
| eBay | 12-15% | Auctions + fixed price |
| Etsy | 6.5% | Handmade, vintage, craft |
| Walmart Marketplace | 8-15% | Growing competitor |

### Comparison Shopping

| Platform | Notes |
|----------|-------|
| Google Shopping | Requires Merchant Center |
| Bing Shopping | Microsoft Advertising |
| PriceGrabber | Price comparison |
| Shopzilla | Shopping aggregator |

### Review Platforms

| Platform | Notes |
|----------|-------|
| Trustpilot | Consumer reviews |
| Better Business Bureau | Trust signal |
| ResellerRatings | E-commerce specific |

## URL Structure

```
/                           # Homepage
/products/                  # All products
/products/[category]/       # Category page
/products/[category]/[product-slug]/  # Product page
/collections/               # Curated collections
/brands/[brand-slug]/       # Brand pages
/search?q=                  # Search results
```

## Keyword Strategy

### Category Keywords

```
[product type] online
buy [product type]
best [product type] [year]
[product type] reviews
cheap [product type]
```

### Product Keywords

```
[brand] [product name]
[product name] review
[product name] vs [competitor]
[product name] price
where to buy [product name]
```

### Transactional Keywords

```
[product] free shipping
[product] discount code
[product] sale
[product] deals
```

## Technical Considerations

### Pagination

Use `rel="next"` and `rel="prev"` for paginated category pages, or implement infinite scroll with proper canonicalization.

### Faceted Navigation

- Canonicalize filtered URLs to main category
- Use `noindex` for low-value filter combinations
- Block crawling of sort parameters

### Product Variants

- Each color/size variant should NOT have its own URL
- Use a single canonical product page
- Handle variants with JavaScript

## Content Strategy

### Product Descriptions

- Unique descriptions (never manufacturer copy)
- Include dimensions, materials, use cases
- Answer common questions
- 300+ words for main products

### Category Pages

- Unique introductory content
- Buying guides
- Comparison tables
- FAQ sections

### Blog Topics

- Buying guides
- Product comparisons
- How-to tutorials
- Industry news
- Customer stories
