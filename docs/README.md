# Doughy AI Documentation

Welcome to the Doughy AI documentation hub. This directory contains comprehensive guides for developing, deploying, and maintaining the Deal OS platform.

---

## Quick Start

- **New to the project?** Start with [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)
- **Setting up integrations?** See [SUPABASE_REFERENCE.md](./SUPABASE_REFERENCE.md)
- **Working with Claude?** Read [CLAUDE_INSTRUCTIONS.md](./CLAUDE_INSTRUCTIONS.md)
- **Having issues?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## Documentation Categories

### 🏗️ Architecture & Systems

**[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)**
Complete guide to design tokens, utilities, components, and patterns. Covers spacing, colors, shadows, typography, and reusable component patterns. Essential for maintaining UI consistency.

**[AI_ASSISTANT.md](./AI_ASSISTANT.md)** ⭐ *NEW - Consolidated*
Comprehensive AI Assistant system documentation. Covers architecture, core components, optimization techniques (97.5% faster responses, 87.5% token reduction), background job processors, two-tier caching, and integration guide. Production-ready with full testing coverage.

**[SUPABASE_REFERENCE.md](./SUPABASE_REFERENCE.md)**
Database schema reference covering 65+ tables across real estate, leads, users, messaging, and billing domains. Includes RLS policies, edge functions, and project configuration.

---

### 🚀 Features & Roadmaps

**[doughy-architecture-refactor.md](./doughy-architecture-refactor.md)** ⭐ *NEW*
Master planning document for multi-platform refactor (RE Investor + Landlord). Defines 5 parallel development zones, interface contracts, database schema, TypeScript types, and Moltbot skill specifications.

**[doughy-refactor-executive-summary.md](./doughy-refactor-executive-summary.md)** ⭐ *NEW*
Executive summary of the architecture refactor. High-level overview of the 5 zones, timeline, and success criteria for stakeholders.

**[DEAL_OS_MVP_WORKSTREAMS.md](./DEAL_OS_MVP_WORKSTREAMS.md)**
MVP workstream planning and feature prioritization for the Deal OS platform. Outlines parallel development zones and core functionality.

**[PHASE_2_PARALLEL_DEV_PLAN.md](./PHASE_2_PARALLEL_DEV_PLAN.md)**
Detailed implementation plan for AI Assistant + Deal Timeline with Zone A/Zone B parallel development strategy. Includes integration points, shared contracts, and development phases.

**[VOICE_AI_FEATURES_ROADMAP.md](./VOICE_AI_FEATURES_ROADMAP.md)**
Voice AI features roadmap including call handling, transcription, manual transcript mode, and continuous walkthrough recording. Future planned features.

---

### 🔧 Development & Guides

**[DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)**
Development workflow, git branching strategy, environment setup (dev, stage, prod), and contribution guidelines. Start here for development process.

**[CLAUDE_INSTRUCTIONS.md](./CLAUDE_INSTRUCTIONS.md)**
Instructions and context for Claude AI to assist with development tasks. Quick reference commands and mode settings for effective AI collaboration.

**[FORM_UTILITIES_GUIDE.md](./FORM_UTILITIES_GUIDE.md)**
Guide to standardized form utilities including FormField component and useForm hook. Complete props reference, usage examples, and best practices.

---

### 🔄 Migrations & Logs

**[COMPONENT_MIGRATION.md](./COMPONENT_MIGRATION.md)**
Component migration tracking and before/after patterns. Documents DataCard, FormField, and Form State migrations to design system. Reference for developers upgrading components.

**[DARK_MODE_MIGRATION_LOG.md](./DARK_MODE_MIGRATION_LOG.md)**
Log of dark mode implementation and migration from NativeWind to inline styles with useThemeColors(). Phase 1 completed with hardcoded color fixes and opacity pattern standardization.

**[FORM_MIGRATIONS_LOG.md](./FORM_MIGRATIONS_LOG.md)**
Comprehensive log of form standardization migrations including before/after code comparisons. 6 migration entries documenting line count reductions and pattern improvements.

**[MIGRATION_STATUS.md](./MIGRATION_STATUS.md)**
Current migration status tracking for various features and components across the platform.

---

### 🐛 Troubleshooting & Reviews

**[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**
Solutions to complex issues including navigation context errors, NativeWind limitations, dark mode catch-22, and common development pitfalls. Essential reference for debugging.

**[UI_UX_CONSOLIDATION_CODE_REVIEW.md](./UI_UX_CONSOLIDATION_CODE_REVIEW.md)**
Code review summary for UI/UX consolidation work. Documents design system updates, component refactoring, and consolidation of 5 duplicate cards into 1 unified DataCard.

---

### 🔗 Archives & History

**[ZONES_ARCHIVE.md](./ZONES_ARCHIVE.md)**
Historical archive of zone-based development phases (A-H) completed January 2026. Includes database rename mapping, key decisions, and integration patterns.

---

## Documentation by Role

### For New Developers

1. **[DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)** - Start here for workflow and git strategy
2. **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** - Understand design patterns and tokens
3. **[SUPABASE_REFERENCE.md](./SUPABASE_REFERENCE.md)** - Learn the database schema
4. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

### For Feature Development

1. **[PHASE_2_PARALLEL_DEV_PLAN.md](./PHASE_2_PARALLEL_DEV_PLAN.md)** - Current development roadmap
2. **[AI_ASSISTANT.md](./AI_ASSISTANT.md)** - AI system architecture and integration
3. **[FORM_UTILITIES_GUIDE.md](./FORM_UTILITIES_GUIDE.md)** - Building forms with standardized utilities
4. **[ZONES_ARCHIVE.md](./ZONES_ARCHIVE.md)** - Historical zone integration archive

### For Code Review

1. **[UI_UX_CONSOLIDATION_CODE_REVIEW.md](./UI_UX_CONSOLIDATION_CODE_REVIEW.md)** - UI/UX review notes and patterns
2. **[COMPONENT_MIGRATION.md](./COMPONENT_MIGRATION.md)** - Migration tracking and patterns
3. **[FORM_MIGRATIONS_LOG.md](./FORM_MIGRATIONS_LOG.md)** - Form migration history with comparisons

### For Working with Claude AI

1. **[CLAUDE_INSTRUCTIONS.md](./CLAUDE_INSTRUCTIONS.md)** - Claude context and commands
2. **[AI_ASSISTANT.md](./AI_ASSISTANT.md)** - AI Assistant system guide
3. **[DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)** - Development processes

---

## File Organization

```
docs/
├── README.md (this file) ............................ Master documentation index
│
├── Architecture & Systems
│   ├── DESIGN_SYSTEM.md ............................ Design tokens & components
│   ├── AI_ASSISTANT.md ............................. AI system (consolidated)
│   └── SUPABASE_REFERENCE.md ....................... Database schema
│
├── Features & Roadmaps
│   ├── doughy-architecture-refactor.md ............ Multi-platform refactor plan
│   ├── doughy-refactor-executive-summary.md ....... Refactor executive summary
│   ├── DEAL_OS_MVP_WORKSTREAMS.md .................. MVP planning
│   ├── PHASE_2_PARALLEL_DEV_PLAN.md ................ Development roadmap
│   └── VOICE_AI_FEATURES_ROADMAP.md ................ Voice AI features
│
├── Development & Guides
│   ├── DEVELOPMENT_WORKFLOW.md ..................... Dev workflow
│   ├── CLAUDE_INSTRUCTIONS.md ...................... Claude AI context
│   └── FORM_UTILITIES_GUIDE.md ..................... Form utilities
│
├── Migrations & Logs
│   ├── COMPONENT_MIGRATION.md ...................... Component migrations
│   ├── DARK_MODE_MIGRATION_LOG.md .................. Dark mode migration
│   ├── FORM_MIGRATIONS_LOG.md ...................... Form migrations
│   └── MIGRATION_STATUS.md ......................... Migration tracking
│
├── Troubleshooting & Reviews
│   ├── TROUBLESHOOTING.md .......................... Common issues
│   └── UI_UX_CONSOLIDATION_CODE_REVIEW.md .......... UI/UX review
│
└── Archives & History
    └── ZONES_ARCHIVE.md ............................ Zone A-H project archive
```

---

## Contributing to Documentation

When adding or updating documentation:

1. **Choose the right file** - Use the categories above to find where your content belongs
2. **Update this index** - Add new files to the appropriate category in this README
3. **Add cross-references** - Link to related documentation where relevant
4. **Keep it current** - Update dates and version info in your files
5. **Be comprehensive** - Include examples, code snippets, and troubleshooting

---

## Recent Updates

### January 2026
- ✅ **Consolidated AI documentation** - Merged 3 Zone A files into comprehensive [AI_ASSISTANT.md](./AI_ASSISTANT.md)
- ✅ **Created master index** - Added this README for easy navigation
- ✅ **Cleaned root directory** - Removed abandoned Expo conversion documentation

### Previous Updates
- Dark mode migration Phase 1 complete
- Form utilities standardization ongoing
- UI/UX consolidation review completed

---

## Documentation Statistics

- **Total Documentation Files:** 18 (including this index)
- **Categories:** 6 major categories
- **Active Documentation:** 17 files
- **Coverage:** Architecture, Features, Development, Migrations, Troubleshooting, Integration

---

## Quick Reference

### Most Referenced Docs
1. [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - For UI/UX work
2. [SUPABASE_REFERENCE.md](./SUPABASE_REFERENCE.md) - For database queries
3. [AI_ASSISTANT.md](./AI_ASSISTANT.md) - For AI features
4. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - When things break

### Getting Started Checklist
- [ ] Read [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)
- [ ] Review [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- [ ] Understand [SUPABASE_REFERENCE.md](./SUPABASE_REFERENCE.md)
- [ ] Bookmark [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- [ ] Read [CLAUDE_INSTRUCTIONS.md](./CLAUDE_INSTRUCTIONS.md) if working with Claude

---

## Need Help?

1. **Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** first for common issues
2. **Search documentation** using your IDE's search across all `.md` files
3. **Review related docs** in the same category
4. **Check inline comments** in the codebase for implementation details

---

**Last Updated:** January 28, 2026
