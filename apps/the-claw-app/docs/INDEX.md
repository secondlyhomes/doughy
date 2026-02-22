# Documentation Index

> 81+ docs across 21 directories. Use this page to find what you need.

## I Want To...

### Get Started
- [Quickstart Guide](../QUICKSTART.md) — zero to running app in 5 minutes
- [Claude Code Setup](00-getting-started/CLAUDE-SETUP.md) — configure Claude Code for development
- [Folder Structure](01-architecture/FOLDER-STRUCTURE.md) — understand the project layout
- [Tech Stack Decisions](01-architecture/ADR-001-TECH-STACK.md) — why Expo, React Native, Supabase, TypeScript
- [Step-by-Step Tutorials](tutorials/) — guided walkthroughs from setup to deployment

### Build Features
- [Add a New Feature](patterns/NEW-FEATURE.md) — Types → Service → Hook → Component → Screen → Tests
- [Add a New Screen](patterns/NEW-SCREEN.md) — screen components with navigation, state, and accessibility
- [Create a Database Table](patterns/SUPABASE-TABLE.md) — schema, RLS, types, service, hook, real-time
- [Integrate AI APIs](patterns/AI-API-CALL.md) — Edge Function architecture with rate limiting and validation

### Write Code
- [Component Guidelines](02-coding-standards/COMPONENT-GUIDELINES.md) — structure, props, accessibility, testing
- [Reusable Components](02-coding-standards/REUSABLE-COMPONENTS.md) — patterns for building a component library
- [Hook Conventions](02-coding-standards/HOOK-CONVENTIONS.md) — custom hook patterns
- [TypeScript Config](02-coding-standards/TYPESCRIPT-CONFIG.md) — strict mode settings

### Manage State
- [State Management Patterns](01-architecture/STATE-MANAGEMENT.md) — Context, AsyncStorage, URL state
- [State Management Decision](01-architecture/ADR-002-STATE-MANAGEMENT.md) — why this approach, not Redux
- [Data Flow](01-architecture/DATA-FLOW.md) — how data moves through the app

### Design UI
- [Design Philosophy](05-ui-ux/DESIGN-PHILOSOPHY.md) — ADHD-friendly, accessibility-first principles
- [Design System](05-ui-ux/DESIGN-SYSTEM.md) — tokens, colors, typography, spacing
- [Theming](05-ui-ux/THEMING.md) — light/dark mode implementation
- [Animation Patterns](05-ui-ux/ANIMATION-PATTERNS.md) — React Native Animated with reduced-motion support
- [Navigation](05-ui-ux/NAVIGATION.md) — React Navigation, deep linking, protected routes

### Use Native Features
- [Permissions Handling](06-native-features/PERMISSIONS-HANDLING.md) — requesting and managing permissions
- [Biometric Auth](06-native-features/BIOMETRIC-AUTH.md) — Face ID, Touch ID, fingerprint
- [Push Notifications](06-native-features/PUSH-NOTIFICATIONS.md) — Expo notifications setup
- [Haptics & Audio](06-native-features/HAPTICS-AUDIO.md) — tactile and audio feedback
- [Platform-Specific Code](06-native-features/PLATFORM-SPECIFIC-CODE.md) — iOS vs Android patterns

### Set Up Auth
- [Auth Setup](04-authentication/AUTH-SETUP.md) — AuthContext, protected routes, session management
- [OAuth Integration](04-authentication/OAUTH-INTEGRATION.md) — Google, Apple Sign-In, PKCE flow

### Set Up Database
- [Supabase Setup](03-database/SUPABASE-SETUP.md) — project creation and configuration
- [Schema Best Practices](03-database/SCHEMA-BEST-PRACTICES.md) — naming, migrations, audit columns
- [RLS Policies](03-database/RLS-POLICIES.md) — row-level security patterns

### Add Payments
- [Payment Architecture](08-payments/PAYMENT-ARCHITECTURE.md) — RevenueCat and Stripe overview
- [RevenueCat Setup](08-payments/REVENUECAT-SETUP.md) — in-app purchases and subscriptions
- [Stripe Web Billing](08-payments/STRIPE-WEB-BILLING.md) — web-based billing portal
- [Entitlements System](08-payments/ENTITLEMENTS-SYSTEM.md) — feature gating by subscription tier

### Optimize AI Costs
- [Cost Optimization](07-ai-integration/COST-OPTIMIZATION.md) — 3-tier routing, caching, rate limiting

### Deploy
- [CI/CD](11-deployment/CI-CD.md) — GitHub Actions + EAS workflows
- [iOS Build Practices](11-deployment/IOS-BUILD-PRACTICES.md) — App Store submission, TestFlight
- [Android Build Practices](11-deployment/ANDROID-BUILD-PRACTICES.md) — Play Store submission, internal testing

### Write Tests
- [Testing Strategy](10-testing/TESTING-STRATEGY.md) — pyramid, tools, coverage targets
- [Unit Tests](10-testing/UNIT-TESTS.md) — Jest patterns
- [Integration Tests](10-testing/INTEGRATION-TESTS.md) — Supabase + service testing
- [E2E Tests](10-testing/E2E-TESTS.md) — Detox patterns for iOS and Android
- [Accessibility Tests](10-testing/ACCESSIBILITY-TESTS.md) — screen reader and accessibility testing
- [Performance Tests](10-testing/PERFORMANCE-TESTS.md) — measuring app performance
- [Security Tests](10-testing/SECURITY-TESTS.md) — security-focused testing
- [AI Prompt Tests](10-testing/AI-PROMPT-TESTS.md) — testing AI integrations
- [Manual Test Checklist](10-testing/MANUAL-TEST-CHECKLIST.md) — pre-release manual testing

### Secure the App
- [Security Checklist](09-security/SECURITY-CHECKLIST.md) — comprehensive security checklist
- [Prompt Injection Security](09-security/PROMPT-INJECTION-SECURITY.md) — AI input defense
- [API Key Management](09-security/API-KEY-MANAGEMENT.md) — secrets handling
- [AI Agent Security](09-security/AI-AGENT-SECURITY.md) — securing AI integrations
- [Bot Protection](09-security/BOT-PROTECTION.md) — anti-bot measures
- [Free Tier Abuse Prevention](09-security/FREE-TIER-ABUSE-PREVENTION.md) — rate limiting for free users
- [Auditing & Compliance](09-security/AUDITING-COMPLIANCE.md) — audit trails

### Handle Incidents
- [Hotfix Process](13-lifecycle/HOTFIX-PROCESS.md) — emergency fix workflow
- [Incident Response](13-lifecycle/INCIDENT-RESPONSE.md) — production incident handling
- [Release Process](13-lifecycle/RELEASE-PROCESS.md) — versioning and release workflow
- [Production Operations](13-lifecycle/PRODUCTION-OPERATIONS.md) — monitoring, logging, backup
- [Runbook](13-lifecycle/RUNBOOK.md) — step-by-step operational procedures
- [Feature Template](13-lifecycle/FEATURE-TEMPLATE.md) — feature specification template

### Maintain the Project
- [Common Issues](12-maintenance/COMMON-ISSUES.md) — known issues and solutions
- [Dependency Management](12-maintenance/DEPENDENCY-MANAGEMENT.md) — updating dependencies
- [Documentation Maintenance](12-maintenance/DOCUMENTATION-MAINTENANCE.md) — keeping docs current
- [Documentation Architecture](12-maintenance/DOCUMENTATION-ARCHITECTURE.md) — why docs are structured this way
- [Automated Maintenance](12-maintenance/AUTOMATED-MAINTENANCE.md) — automated health checks
- [Troubleshooting](12-maintenance/TROUBLESHOOTING.md) — debugging guide

### Troubleshoot Issues
- [Common Errors](troubleshooting/COMMON-ERRORS.md) — error messages and fixes
- [Integration Issues](troubleshooting/INTEGRATION-ISSUES.md) — third-party integration problems
- [Performance Issues](troubleshooting/PERFORMANCE-ISSUES.md) — diagnosing slowdowns
- [Platform Issues](troubleshooting/PLATFORM-ISSUES.md) — iOS and Android specific problems

### Use Developer Tools
- [Developer Tools](13-developer-tools/DEVELOPER-TOOLS.md) — code generators, doctor scripts

### Avoid Mistakes
- [What Not to Do](anti-patterns/WHAT-NOT-TO-DO.md) — anti-patterns with BAD/GOOD examples
- [ADR Template](decisions/TEMPLATE.md) — architecture decision record template

### Build Enterprise Features
- [Multi-Tenancy](patterns/enterprise/MULTI-TENANCY.md) — organization-based isolation
- [Enterprise Authentication](patterns/enterprise/ENTERPRISE-AUTHENTICATION.md) — SAML, SCIM, session management
- [Audit Logging](patterns/enterprise/AUDIT-LOGGING.md) — tamper-evident audit trails
- [Feature Flags](patterns/enterprise/FEATURE-FLAGS.md) — progressive feature rollout
- [Enterprise README](patterns/enterprise/README.md) — overview of all enterprise patterns

## Directory Map

```
docs/
├── 00-getting-started/   # Setup and onboarding
├── 01-architecture/      # Architecture decisions, state, data flow, scaling
├── 02-coding-standards/  # Component, hook, TypeScript conventions
├── 03-database/          # Supabase setup, schema, RLS
├── 04-authentication/    # Auth setup, OAuth
├── 05-ui-ux/             # Design system, philosophy, theming, navigation
├── 06-native-features/   # Permissions, biometric, push, haptics, platform-specific
├── 07-ai-integration/    # AI cost optimization
├── 08-payments/          # RevenueCat, Stripe, entitlements
├── 09-security/          # Security checklist, prompt injection, API keys
├── 10-testing/           # Testing strategy, unit/integration/E2E patterns
├── 11-deployment/        # CI/CD, iOS/Android build practices
├── 12-maintenance/       # Common issues, dependencies, troubleshooting
├── 13-developer-tools/   # Code generators, utilities
├── 13-lifecycle/         # Releases, hotfixes, incidents, production ops
├── anti-patterns/        # What not to do
├── decisions/            # ADR template
├── patterns/             # Step-by-step implementation patterns
├── troubleshooting/      # Categorized error resolution
├── tutorials/            # Step-by-step learning guides
└── video-guides/         # Video walkthroughs
```
