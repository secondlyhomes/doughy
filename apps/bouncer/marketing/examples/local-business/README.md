# Local Business SEO Example

Complete SEO implementation for local businesses including restaurants, fitness studios, retail stores, and service businesses.

> This example uses a restaurant as the primary case study. Adapt the patterns for your specific local business type.

## Schema Types

### Restaurant (Main Schema)

```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "The Corner Bistro",
  "description": "Farm-to-table American cuisine in downtown Austin. Seasonal menus, craft cocktails, weekend brunch.",
  "url": "https://cornerbistro.com",
  "telephone": "(512) 555-1234",
  "email": "hello@cornerbistro.com",
  "servesCuisine": ["American", "Farm-to-table"],
  "priceRange": "$$",
  "acceptsReservations": true,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "100 Congress Ave",
    "addressLocality": "Austin",
    "addressRegion": "TX",
    "postalCode": "78701",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "30.2672",
    "longitude": "-97.7431"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday"],
      "opens": "11:00",
      "closes": "22:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Friday", "Saturday"],
      "opens": "11:00",
      "closes": "23:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Sunday"],
      "opens": "10:00",
      "closes": "15:00"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6",
    "reviewCount": "412"
  },
  "sameAs": [
    "https://instagram.com/cornerbistro",
    "https://facebook.com/cornerbistro"
  ]
}
```

### Menu Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Menu",
  "name": "Dinner Menu",
  "description": "Our seasonal dinner menu featuring locally-sourced ingredients",
  "hasMenuSection": [
    {
      "@type": "MenuSection",
      "name": "Appetizers",
      "hasMenuItem": [
        {
          "@type": "MenuItem",
          "name": "Roasted Beet Salad",
          "description": "Local beets, goat cheese, candied walnuts, arugula",
          "offers": {
            "@type": "Offer",
            "price": "14",
            "priceCurrency": "USD"
          },
          "suitableForDiet": ["VegetarianDiet", "GlutenFreeDiet"]
        },
        {
          "@type": "MenuItem",
          "name": "Crispy Calamari",
          "description": "Lightly fried with lemon aioli and marinara",
          "offers": {
            "@type": "Offer",
            "price": "16",
            "priceCurrency": "USD"
          }
        }
      ]
    },
    {
      "@type": "MenuSection",
      "name": "Entrees",
      "hasMenuItem": [
        {
          "@type": "MenuItem",
          "name": "Grilled Ribeye",
          "description": "14oz Texas ribeye, herb butter, roasted potatoes",
          "offers": {
            "@type": "Offer",
            "price": "42",
            "priceCurrency": "USD"
          },
          "suitableForDiet": ["GlutenFreeDiet"]
        }
      ]
    }
  ]
}
```

## Directory Listings

### Priority 1 (Week 1)

| Directory | URL | Notes |
|-----------|-----|-------|
| Google Business Profile | business.google.com | Required, enables Google Maps |
| Yelp | biz.yelp.com | #1 restaurant review site |
| TripAdvisor | tripadvisor.com/Owners | Tourism, travel searches |
| OpenTable | restaurant.opentable.com | If accepting reservations |

### Priority 2 (Week 2-3)

| Directory | URL | Notes |
|-----------|-----|-------|
| Facebook Business | facebook.com/business | Social presence |
| Instagram Business | business.instagram.com | Visual platform, essential |
| Bing Places | bingplaces.com | Voice assistants |
| Apple Business Connect | businessconnect.apple.com | Siri, Apple Maps |

### Food Delivery Platforms

| Platform | Commission | Notes |
|----------|------------|-------|
| DoorDash | 15-30% | 67% US market share |
| Uber Eats | 15-30% | Global reach |
| Grubhub | 15-30% | Strong in metros |
| ChowNow | Flat fee | Commission-free |
| Toast TakeOut | Flat fee | Commission-free |

## Keyword Strategy

### Local Keywords

```
[cuisine] restaurant [city]
best [cuisine] in [city]
[cuisine] near me
[neighborhood] restaurants
late night food [city]
brunch [city]
```

### Specific Keywords

```
[dish name] [city]
[cuisine] [dietary restriction] [city]
restaurant with [feature] [city]
[occasion] dinner [city]
```

### Event Keywords

```
private dining [city]
party venue [city]
corporate events [city]
wedding rehearsal dinner [city]
```

## Page Structure

### Homepage

```
/
```
Restaurant name, cuisine, location, hours, reservation CTA

### Menu Pages

```
/menu/
/menu/dinner/
/menu/lunch/
/menu/brunch/
/menu/drinks/
```

### Location/Hours

```
/location/
/hours/
/contact/
```

### Events/Private Dining

```
/private-dining/
/events/
/catering/
```

## SEO Component Example

```tsx
// pages/menu.tsx
import { SEO } from '@/components/SEO';
import { SocialMeta } from '@/components/SocialMeta';
import { JsonLd } from '@/components/JsonLd';

export function MenuPage({ menu }) {
  return (
    <>
      <SEO
        title="Menu"
        description="View our seasonal menu featuring farm-to-table American cuisine. Appetizers from $12, entrees from $24. Vegetarian, vegan, and gluten-free options available."
      />

      <SocialMeta
        title="The Corner Bistro Menu"
        description="Farm-to-table American cuisine. Seasonal ingredients, craft cocktails."
        image="/images/menu-hero.jpg"
        url="/menu"
      />

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Menu',
          name: 'Dinner Menu',
          hasMenuSection: menu.sections.map((section) => ({
            '@type': 'MenuSection',
            name: section.name,
            hasMenuItem: section.items.map((item) => ({
              '@type': 'MenuItem',
              name: item.name,
              description: item.description,
              offers: {
                '@type': 'Offer',
                price: item.price,
                priceCurrency: 'USD',
              },
            })),
          })),
        }}
      />

      {/* Page content */}
    </>
  );
}
```

## Content Strategy

### Blog/News Topics

- Seasonal menu updates
- Chef profiles
- Ingredient sourcing stories
- Behind-the-scenes
- Recipe shares (builds authority)
- Local event participation

### User-Generated Content

- Encourage Instagram tagging
- Share customer photos
- Respond to all reviews

## Review Strategy

### Targets

- 4-6 new Google reviews per month
- Maintain 4.0+ average
- Respond to ALL reviews within 24 hours

### How to Ask

- Table cards with QR code
- Receipt footer
- Post-meal email (if reservation system)
- Server mention after positive feedback

### Response Template (Positive)

> Thank you for the wonderful review, [Name]! We're so glad you enjoyed [specific dish/experience mentioned]. We look forward to seeing you again soon. - The Corner Bistro Team

### Response Template (Negative)

> We're sorry to hear about your experience, [Name]. This isn't the standard we hold ourselves to. Please reach out to [email] so we can make it right. - [Manager Name]

## Google Business Optimization

### Photos to Add

- Exterior (helps people find you)
- Interior ambiance
- Popular dishes (each one)
- Drinks/cocktails
- Team/chef
- Private dining space

### Posts (Weekly)

- Daily specials
- New menu items
- Events
- Holiday hours
- Behind-the-scenes

### Menu Upload

Upload your menu directly to Google Business Profile for "menu" searches.
