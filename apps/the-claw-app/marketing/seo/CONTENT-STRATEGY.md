# Content Strategy & Automation

Google values fresh content, but there's a right way and a wrong way to do this.

## The Rules

**Right way**: Update real data, rotate genuine content, refresh descriptions with current information.

**Wrong way**: Mass-generating AI pages or changing dates without substantive updates.

Google issued manual penalties for "Scaled Content Abuse" starting June 2025, hitting sites that published large volumes of low-effort AI content.

**Google's position**: "Appropriate use of AI or automation is not against our guidelines. This means that it is not used to generate content primarily to manipulate search rankings."

The key: Is content helpful and accurate, or mass-produced to game rankings?

## Safe Automation Strategies

### 1. Market Data Updates (Quarterly)

Update statistics with real, current data:
- Industry benchmarks
- Pricing trends
- Market size/growth
- Customer demographics

### 2. Seasonal Content Rotation

Legitimate content maintenance:
- Update imagery for seasons
- Refresh descriptions with seasonal context
- Rotate featured items/services
- Update event calendars

### 3. Testimonial Rotation

Keep social proof current:
- Display recent reviews
- Rotate featured testimonials
- Update case study highlights

### 4. Blog Post Refreshes

Update existing content with:
- Current year data
- New developments
- Additional examples
- Updated screenshots

## GitHub Actions Automation

Free and unlimited for public repos, 2,000 minutes/month for private.

### Weekly Content Update Workflow

```yaml
# .github/workflows/content-update.yml
name: Weekly Content Update

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9am UTC
  workflow_dispatch:  # Manual trigger

jobs:
  update-content:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - name: Update market data
        run: node scripts/update-market-data.js
        env:
          DATA_API_KEY: ${{ secrets.DATA_API_KEY }}

      - name: Generate content variations
        run: node scripts/generate-variations.js
        env:
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}

      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add src/data/
          git diff --staged --quiet || git commit -m "chore: weekly content update"
          git push
```

### Content Update Script Example

```javascript
// scripts/update-market-data.js
import fs from 'fs';

const dataFile = './src/data/market-stats.json';

async function updateMarketData() {
  // Fetch from your data source
  const response = await fetch('https://api.example.com/market-data');
  const newData = await response.json();

  // Merge with existing data
  const existing = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  const updated = {
    ...existing,
    ...newData,
    lastUpdated: new Date().toISOString(),
  };

  fs.writeFileSync(dataFile, JSON.stringify(updated, null, 2));
  console.log('Market data updated');
}

updateMarketData();
```

## Free AI APIs for Content

### Groq (Recommended)

- **Free tier**: 1,000 requests/day for `llama-3.3-70b-versatile`, no credit card
  - Smaller models like `llama-3.1-8b-instant` get 14,400 RPD
- **Model**: Llama 3.3 70B (high quality) - $0.59/M input, $0.79/M output
- **Speed**: 300+ tokens/second

```javascript
// scripts/generate-variations.js
const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function generateVariation(template, context) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful content assistant. Write naturally and accurately.',
        },
        {
          role: 'user',
          content: `Rewrite this content for ${context.season} in ${context.location}:\n\n${template}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
```

### Google Gemini Flash-Lite (Backup)

- **Free tier**: ~1,000 requests/day
- Slightly slower but reliable

### Workflow

1. Human writes templates with structure
2. AI fills in seasonal/geographic variations
3. Human reviews output
4. Automated commit and deploy

## JSON Data Files

Store rotating content in simple JSON files:

```
src/data/
├── testimonials.json
├── market-stats.json
├── seasonal-content.json
└── featured-items.json
```

React components read from these files. No database, no CMS, no cost.

### Example Structure

```json
// src/data/testimonials.json
{
  "lastUpdated": "2026-02-01",
  "featured": [
    {
      "id": "t1",
      "name": "Jane D.",
      "location": "Austin, TX",
      "text": "Excellent service, highly recommend!",
      "rating": 5,
      "date": "2026-01-15"
    }
  ],
  "rotation": ["t1", "t2", "t3"]
}
```

## Content Calendar

### Weekly

- [ ] 1 social media post
- [ ] Google Business Profile update
- [ ] Review/testimonial outreach

### Monthly

- [ ] 1 blog post or content update
- [ ] 1-2 location/category pages
- [ ] Competitor keyword check

### Quarterly

- [ ] Market statistics refresh
- [ ] Seasonal content updates
- [ ] Performance audit

## CMS Option (If Needed)

If non-technical team members need to edit content:

**Sanity** (Recommended)
- Free tier: 20 user seats
- React-based editing interface
- Headless CMS, works with any frontend

## Avoid These Mistakes

| Don't | Why |
|-------|-----|
| Mass-generate city pages with AI | Google penalizes scaled content abuse |
| Change dates without updating content | Detected and penalized |
| Publish unreviewed AI content | Quality issues, potential misinformation |
| Generate 100+ pages at once | Looks spammy, triggers review |
| Duplicate content across pages | Dilutes rankings |

## Resources

- [Google Helpful Content Guidelines](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Groq API Documentation](https://console.groq.com/docs/quickstart)
