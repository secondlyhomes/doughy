# AI Search Optimization

Among users who actively use AI tools, 37% now start product discovery in AI interfaces like ChatGPT and Perplexity ([Eight Oh Two Marketing, January 2026](https://eightohtwomkt.com)). Google AI Overviews appear on 15-60% of search queries depending on methodology (Semrush reports ~16%, while Advanced Web Ranking shows 50-60%).

## How AI Search Works

AI systems use Retrieval-Augmented Generation (RAG):
1. User asks a question
2. AI retrieves relevant content from its index
3. AI synthesizes an answer and cites sources

**Key insight**: Classic SEO metrics (backlinks, domain authority) have weak correlation with AI citations. LLMs have their own preferences.

## Platform Preferences

### ChatGPT Favors

| Source | Citation Share |
|--------|---------------|
| Wikipedia | ~7.8% |
| Reddit | ~29% (top cited) |
| G2 | ~1.1% |
| Forbes | ~1.1% |

*Source: Profound dataset of 680M+ citations, Ahrefs analysis*

ChatGPT prefers:
- High domain authority
- Good Flesch readability score
- Authoritative, factual content
- Clear structure
- Community discussions (Reddit is #1-2 most cited domain)

### Perplexity Favors

| Source | Ranking |
|--------|---------|
| Reddit | #1 (may be overtaken by YouTube in 2026) |
| YouTube | #2 |
| LinkedIn | #3 |

*Source: Profound data. YouTube gaining ground in early 2026.*

Perplexity prefers:
- User-generated content
- Community discussions
- Recent/timely content
- First-person experiences

## Optimization Strategies

### 1. Structured Data (Critical)

Schema markup helps LLMs:
- Understand content type
- Extract factual claims
- Establish entity relationships
- Cite information confidently

See [STRUCTURED-DATA.md](STRUCTURED-DATA.md) for implementation.

### 2. Clear, Factual Content

AI systems prefer content that:
- States facts clearly
- Uses simple sentence structure
- Avoids jargon without explanation
- Includes specific numbers and data

**Good**: "Our service costs $99/month and includes 5 users."

**Bad**: "Our competitively priced solution offers enterprise-grade functionality."

### 3. Q&A Format

Structure content as questions and answers:

```markdown
## How much does [product] cost?

[Product] costs $99/month for the standard plan,
which includes [features]. Enterprise pricing
starts at $499/month.
```

This maps directly to how users query AI assistants.

### 4. Entity Definition

Define what you are clearly on your homepage:

```
[Company Name] is a [type of business] based in [location]
that provides [services] for [audience].
```

This helps AI systems categorize and describe you accurately.

### 5. Third-Party Presence

Get mentioned on platforms AI systems trust:

**For ChatGPT citations**:
- Wikipedia (if notable enough for an article)
- G2, Capterra (for software)
- Industry publications
- Forbes, major news outlets

**For Perplexity citations**:
- Reddit discussions (authentic, not promotional)
- YouTube videos/reviews
- LinkedIn articles and posts
- Quora answers

### 6. Freshness Signals

Both systems favor recent content:
- Update key pages quarterly
- Include publication and modification dates
- Reference current year in titles/content where relevant

### 7. Author/Entity Authority

Establish expertise signals:
- Author bylines with credentials
- About page with team bios
- Links to social profiles
- Published work/mentions

## Content Format Tips

### For AI Citation

| Do | Don't |
|----|-------|
| Use clear headings (H2, H3) | Wall of text |
| Short paragraphs (2-3 sentences) | Long, complex sentences |
| Bulleted lists for features | Dense prose |
| Include specific numbers | Vague claims |
| Define technical terms | Assume knowledge |

### Page Structure

```markdown
# [Topic]

[One-sentence definition]

## Key Points

- Point 1 with specific data
- Point 2 with specific data
- Point 3 with specific data

## How It Works

[Clear explanation in simple terms]

## FAQ

### [Common Question 1]?
[Direct answer]

### [Common Question 2]?
[Direct answer]
```

## Monitoring AI Visibility

### Tools

| Tool | Pricing | Notes |
|------|---------|-------|
| [Profound](https://profound.ai) | $99-399/mo | Starter $99 (ChatGPT only), Growth $399 (3 engines), no free trial |
| [Otterly.ai](https://otterly.ai) | From $29/mo | Tracks ChatGPT, Perplexity, Google AIO (no free tier) |
| [Am I Cited](https://www.amicited.com) | Free tier | Monitors AI citations across ChatGPT, Perplexity, Google AIO, Gemini |
| [Goodie AI](https://goodie.ai) | Varies | AI visibility monitoring |
| [Brandi AI](https://brandi.ai) | Varies | Brand monitoring in AI |
| Manual checking | Free | Query AI systems directly |

### New Platforms to Watch

- **Google AI Mode** (launched October 2025): 100M+ monthly active users
- **ChatGPT Shopping**: 50M+ daily queries
- **GPT-5.2** (December 2025): Enhanced citation capabilities
- **Microsoft AEO/GEO Guide** (January 2026): Official optimization recommendations

### Manual Monitoring

Periodically ask AI assistants:
- "What is [your company]?"
- "How does [your product] compare to [competitor]?"
- "[Your service type] in [your city]"

Note what they say and which sources they cite.

## 2026 Reality Check

By mid-2026:
- Citation patterns are becoming entrenched
- Authority domains are locked in positions
- New entrants face higher barriers

**Act now** while AI citation patterns are still forming.

## Avoid These Mistakes

| Don't | Why |
|-------|-----|
| Stuff keywords unnaturally | AI detects and ignores |
| Create thin content at scale | AI prefers depth |
| Use promotional language | AI favors factual tone |
| Ignore structured data | Major missed opportunity |
| Only optimize for Google | AI search is growing fast |

## Integration with Traditional SEO

AI optimization doesn't conflict with Google SEO—it enhances it:

| Traditional SEO | AI Optimization |
|-----------------|-----------------|
| Backlinks | Third-party mentions |
| Keywords | Clear factual statements |
| Meta descriptions | Structured data |
| Page speed | Still matters for crawling |
| Mobile-first | Universal requirement |

## Resources

- [Schema.org for LLMs](https://www.quoleady.com/schema-structured-data-for-llm-visibility/)
- [ALM AI Discovery Research](https://almcorp.com/blog/ai-discovery-2-million-llm-sessions-analysis-2026/)
- [Am I Cited Blog](https://www.amicited.com/blog/)
