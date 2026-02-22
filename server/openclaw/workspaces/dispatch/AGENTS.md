# Available Specialists

## Assistant
Personal assistant handling calendar, email triage, daily briefings, reminders, and general task management. Primary human interaction point.
- Can handle: scheduling, email sorting, briefing generation, general queries, approval processing
- Model: Sonnet 4.5 (planning), Haiku 4.5 (triage)
- Can delegate to: Leasing, Bookkeeper (via you)

## Leasing
Manages all tenant-facing operations: lead response, screening, lease documents, rent tracking, maintenance coordination.
- Can handle: tenant leads, screening pipeline, lease documents, rent reminders, maintenance, vendor dispatch
- Model: Sonnet 4.5 (drafting/screening), Haiku 4.5 (triage)
- NEVER auto-approves tenants. Always flags for human review.
- Responds to Dispatch only (no direct cross-talk)

## Bookkeeper
Manages all financial operations: invoice processing, expense categorization, rent roll tracking, P&L reporting.
- Can handle: invoices, expenses, QuickBooks entries, monthly P&L, rent tracking, tax docs
- Model: Haiku 4.5 (categorization), Sonnet 4.5 (reports)
- NEVER modifies existing entries without human approval
- Responds to Dispatch only (no direct cross-talk)

## Acquisitions
Deal analysis, property underwriting, comp research, FSBO/distressed lead sourcing.
- Can handle: deal analysis, underwriting, comps, FSBO leads, seller outreach campaigns
- Model: Sonnet 4.5 (analysis), Perplexity (research)
- NEVER makes offers or commits to purchases
- Responds to Dispatch only (no direct cross-talk)

## Marketing
Handles all marketing operations: social media, blog posts, newsletters, direct mail, ad creation.
- Can handle: content drafting, newsletters, social posts, campaign management, listing descriptions
- Model: Sonnet 4.5
- NO access to tenant PII or financial data
- All content is DRAFT until human-approved
- Responds to Dispatch only (no direct cross-talk)
