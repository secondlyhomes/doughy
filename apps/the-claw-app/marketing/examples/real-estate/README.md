# Real Estate SEO Example

Complete SEO implementation for real estate websites: listings, agents, neighborhoods.

## Schema Types

### RealEstateAgent (Homepage/About)

```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "Acme Realty",
  "description": "Full-service real estate agency serving Northern Virginia since 2010",
  "url": "https://acmerealty.com",
  "telephone": "(703) 555-1234",
  "email": "info@acmerealty.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main Street",
    "addressLocality": "Arlington",
    "addressRegion": "VA",
    "postalCode": "22201",
    "addressCountry": "US"
  },
  "areaServed": [
    { "@type": "City", "name": "Arlington, VA" },
    { "@type": "City", "name": "Alexandria, VA" },
    { "@type": "City", "name": "Fairfax, VA" }
  ],
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Saturday"],
      "opens": "10:00",
      "closes": "16:00"
    }
  ],
  "sameAs": [
    "https://facebook.com/acmerealty",
    "https://instagram.com/acmerealty",
    "https://linkedin.com/company/acmerealty"
  ]
}
```

### RealEstateListing (Property Pages)

```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "name": "3BR Home for Rent in Arlington",
  "description": "Spacious 3-bedroom, 2-bathroom home with updated kitchen, hardwood floors, and fenced backyard. Walking distance to Metro.",
  "url": "https://acmerealty.com/rentals/123-main-st-arlington",
  "datePosted": "2026-01-15",
  "image": [
    "https://acmerealty.com/images/123-main-1.jpg",
    "https://acmerealty.com/images/123-main-2.jpg"
  ],
  "offers": {
    "@type": "Offer",
    "price": "2400",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main Street",
    "addressLocality": "Arlington",
    "addressRegion": "VA",
    "postalCode": "22201",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "38.8816",
    "longitude": "-77.0910"
  },
  "numberOfRooms": 3,
  "numberOfBathroomsTotal": 2,
  "floorSize": {
    "@type": "QuantitativeValue",
    "value": "1500",
    "unitCode": "FTK"
  }
}
```

## Directory Listings

### Priority 1 (Week 1)

| Directory | URL | Notes |
|-----------|-----|-------|
| Google Business Profile | business.google.com | Required |
| Zillow | zillow.com/agent | Largest real estate portal |
| Realtor.com | realtor.com/agentprofile | Official NAR listings |
| Yelp | biz.yelp.com | High domain authority |

### Priority 2 (Week 2-3)

| Directory | URL | Notes |
|-----------|-----|-------|
| Trulia | trulia.com | Neighborhood focus |
| Apartments.com | apartments.com | Rental listings |
| HotPads | hotpads.com | Map-based search |
| Redfin | redfin.com | Agent profiles |
| Bing Places | bingplaces.com | Powers Cortana |
| Apple Business Connect | businessconnect.apple.com | Powers Siri |

### Priority 3 (Ongoing)

| Directory | URL | Notes |
|-----------|-----|-------|
| Nextdoor | business.nextdoor.com | Local trust |
| Facebook Business | facebook.com/business | Social presence |
| LinkedIn Company | linkedin.com/company | B2B credibility |
| Local Chamber of Commerce | - | Local authority |

## Neighborhood Landing Pages

### URL Structure

```
/rentals/arlington-va/
/rentals/alexandria-va/
/buy/fairfax-county-va/
/neighborhoods/clarendon/
```

### Page Template

```markdown
# [Neighborhood] Rentals | [City], [State]

[2-3 sentences about the neighborhood - unique, not templated]

## Why [Neighborhood]?

- [Unique characteristic 1]
- [Unique characteristic 2]
- [Unique characteristic 3]

## Available Rentals in [Neighborhood]

[Dynamic listing grid]

## About [Neighborhood]

[300-500 words of unique content about the area]

### Nearby Amenities

- Schools: [List local schools]
- Transit: [Metro stations, bus routes]
- Shopping: [Notable retail areas]
- Dining: [Popular restaurants]

### Commute Times

| Destination | Drive | Transit |
|-------------|-------|---------|
| Downtown DC | 15 min | 25 min |
| Pentagon | 10 min | 15 min |

## Testimonials

[1-2 testimonials from residents or clients]

## Nearby Neighborhoods

- [Link to related neighborhood 1]
- [Link to related neighborhood 2]
```

## Keyword Clusters

### Rental Keywords

```
medium term rental [city] [state]
furnished rental [city]
corporate housing [city]
travel nurse housing [city]
3 month lease [city]
room for rent [city]
shared housing [city]
```

### Buying Keywords

```
homes for sale [city] [state]
first time home buyer [city]
real estate agent [city]
houses under [price] [city]
new construction [city]
```

### Neighborhood Keywords

```
best neighborhoods in [city]
[neighborhood] apartments
living in [neighborhood]
[neighborhood] vs [neighborhood]
```

## SEO Component Example

```tsx
// pages/rental-listing.tsx
import { SEO } from '@/components/SEO';
import { SocialMeta } from '@/components/SocialMeta';
import { JsonLd } from '@/components/JsonLd';

export function RentalListingPage({ listing }) {
  const title = `${listing.bedrooms}BR ${listing.type} for Rent in ${listing.city}`;
  const description = `${listing.bedrooms}-bedroom, ${listing.bathrooms}-bathroom ${listing.type} for $${listing.price}/month in ${listing.neighborhood}, ${listing.city}. ${listing.highlights.slice(0, 2).join('. ')}.`;

  return (
    <>
      <SEO title={title} description={description} />

      <SocialMeta
        title={`${title} - $${listing.price}/mo`}
        description={description}
        image={listing.images[0]}
        url={`/rentals/${listing.slug}`}
      />

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'RealEstateListing',
          name: title,
          description,
          url: `https://acmerealty.com/rentals/${listing.slug}`,
          datePosted: listing.listedDate,
          image: listing.images,
          offers: {
            '@type': 'Offer',
            price: listing.price,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          },
          address: {
            '@type': 'PostalAddress',
            addressLocality: listing.city,
            addressRegion: listing.state,
            postalCode: listing.zip,
          },
          numberOfRooms: listing.bedrooms,
          numberOfBathroomsTotal: listing.bathrooms,
        }}
      />

      {/* Page content */}
    </>
  );
}
```

## Content Automation

### Market Data to Update Quarterly

- Median rent prices by neighborhood
- Days on market
- Rental inventory levels
- Year-over-year price changes

### Seasonal Content Rotation

| Season | Content Focus |
|--------|---------------|
| Spring | Cherry blossoms, outdoor spaces, move-in timing |
| Summer | Pools, AC, school district info |
| Fall | Foliage, heating costs, lease timing |
| Winter | Snow removal, proximity to indoor amenities |

## Review Strategy

Target: 2-4 Google reviews per month

### Ask After

- Successful closing
- Lease signing
- Showing (if positive feedback)
- 30 days post move-in

### Direct Review Link

```
https://search.google.com/local/writereview?placeid=[YOUR-PLACE-ID]
```
