# Documentation Maintenance & Web Research Guidelines

**Last Updated:** 2026-02-05
**Purpose:** Ensure documentation stays current with latest best practices and industry standards

---

## Why Web Research Matters

Technology evolves rapidly. Best practices from 6 months ago may be outdated today. Regular web research ensures:

- ✅ Documentation reflects current industry standards
- ✅ Recommendations use stable, maintained tools
- ✅ Setup instructions work with latest SDK versions
- ✅ Security practices follow current guidelines
- ✅ Performance optimizations leverage newest features

**Rule:** Always research before documenting. Never rely solely on training data.

---

## When to Research

### Required Research Scenarios

| Scenario | Why Research |
|----------|--------------|
| **Creating new feature documentation** | Verify current best practices haven't changed |
| **Updating existing docs** | Check if newer patterns emerged |
| **Recommending tools/libraries** | Confirm tool is still maintained and popular |
| **Writing setup guides** | Ensure commands work with latest versions |
| **Security-related changes** | Stay current with vulnerability disclosures |
| **Performance optimizations** | New SDK features may offer better approaches |

### Periodic Review Schedule

- **Every 3 months:** Review core features (setup, authentication, notifications)
- **Every 6 months:** Review optional features (component docs, testing, PWA)
- **After major SDK releases:** Update all affected documentation

---

## How to Research Effectively

### 1. Official Documentation First

Always start with official sources:
- **Expo:** https://docs.expo.dev/
- **React Native:** https://reactnative.dev/
- **Supabase:** https://supabase.com/docs

### 2. GitHub Repository Checks

Verify tool viability:
```bash
# Check recent activity
gh repo view REPO_NAME --json pushedAt,stargazerCount,openIssuesCount

# Check if still maintained
gh api repos/OWNER/REPO/commits --jq '.[0].commit.author.date'
```

**Red flags:**
- Last commit > 12 months ago
- Unresolved critical issues (security, compatibility)
- Declining star count or fork activity

### 3. Production Example Validation

Check real-world usage:
- Search GitHub for: `"expo-notifications" stars:>1000`
- Look for apps using similar stack: React Native + Expo + your target feature
- Review their package.json and implementation patterns

**Examples of production repos to check:**
- BlueSky: https://github.com/bluesky-social/social-app
- Expo Examples: https://github.com/expo/examples
- Curated Apps List: https://github.com/ReactNativeNews/React-Native-Apps

### 4. Community Validation

Cross-reference findings:
- Expo Discord/Forums (recent discussions)
- Stack Overflow (recent answers with high votes)
- Dev.to, Medium (2025-2026 articles only)
- Reddit r/reactnative, r/expo (past 6 months)

---

## Research Checklist

When documenting a new feature, complete this checklist:

- [ ] **Official docs checked** - Read latest Expo/RN documentation
- [ ] **Tool viability verified** - Checked GitHub activity, stars, issues
- [ ] **SDK compatibility confirmed** - Works with current Expo SDK version
- [ ] **Production examples found** - At least 2 real apps using this pattern
- [ ] **Community validation** - Recent discussions confirm this approach
- [ ] **Alternatives evaluated** - Compared 2-3 similar solutions
- [ ] **Breaking changes noted** - Documented migration paths if needed

---

## Documentation Update Template

When updating docs based on research, use this format:

```markdown
<!-- Updated: YYYY-MM-DD -->
<!-- Verified with: Expo SDK XX, React Native 0.XX -->
<!-- Sources: [source1], [source2], [source3] -->

## [Feature Name]

### Current Best Practice (2026)

[What's currently recommended]

### Changed Since Previous Version

- **Old approach:** [what was recommended before]
- **Why changed:** [reason for update]
- **Migration path:** [how to upgrade]

### Sources

- [Official Docs](URL)
- [Production Example](URL)
- [Community Discussion](URL)
```

---

## Documenting Research Findings

### In Feature READMEs

Include a "Research Notes" section:

```markdown
## Research Notes

**Last Verified:** 2026-02-05
**Expo SDK:** 55
**Key Changes:**
- expo-notifications now uses FCM V1 API (V0 deprecated)
- iOS push requires Expo SDK 52+ for full support
- Development builds required for testing (Expo Go limitations)

**Sources:**
- https://docs.expo.dev/push-notifications/overview/
- https://github.com/expo/expo/issues/XXXXX
```

### In CLAUDE.md

Add to top of file:

```markdown
## Documentation Freshness

**Last Research Review:** 2026-02-05
**Next Review Due:** 2026-05-05 (3 months)
**Verified Against:** Expo SDK 55, React Native 0.83

Claude, before implementing features, ALWAYS:
1. Check docs.expo.dev for latest official guidance
2. Search GitHub for production examples (2025-2026)
3. Verify tools are actively maintained
4. Update this timestamp when research is performed
```

---

## Web Research Commands

### For Claude Code (AI Assistant)

```markdown
# Search for current best practices
WebSearch: "Expo SDK 2026 best practices [feature-name]"
WebSearch: "React Native [feature-name] 2026 production guide"

# Tool viability check
WebSearch: "[tool-name] vs [alternative] 2026 comparison"
WebSearch: "[tool-name] GitHub issues 2026"

# Real-world examples
WebSearch: "open source Expo app [feature-name] GitHub 2026"
WebSearch: "[feature-name] production implementation React Native"

# Fetch official docs
WebFetch: https://docs.expo.dev/[topic]/
WebFetch: https://reactnative.dev/docs/[topic]
```

### For Manual Research

```bash
# Check GitHub activity
gh repo view expo/expo --json pushedAt,stargazerCount
gh api repos/expo/expo/commits --jq '.[0:5]'

# Check npm download trends
npm info expo-notifications dist-tags
npm view expo-notifications time

# Search GitHub code
gh search code "expo-notifications" --language TypeScript --limit 10

# Find example repos
gh search repos "expo react-native" --stars ">500" --sort stars
```

---

## Handling Outdated Documentation

When you find outdated docs:

1. **Flag the issue:**
   ```markdown
   <!-- ⚠️ OUTDATED: This section needs research -->
   <!-- Last verified: [old date] -->
   <!-- Known issues: [describe what's outdated] -->
   ```

2. **Research current approach:**
   - Check official docs
   - Find production examples
   - Verify community consensus

3. **Update with migration notes:**
   ```markdown
   ### Migration from Old Approach

   If you followed previous docs, here's how to upgrade:
   1. [Step-by-step migration]
   2. [Breaking changes to handle]
   3. [Testing to ensure it works]
   ```

---

## AI Agent Instructions

When using Claude Code or other AI assistants, include these instructions in CLAUDE.md:

```markdown
## Web Research Protocol

Before ANY implementation or documentation work:
1. Use WebSearch to find current best practices (always search for "2026")
2. Use WebFetch to check official docs (docs.expo.dev)
3. Use gh CLI to verify tool maintenance status
4. Document sources in comments and README
5. Update "Last Verified" timestamp in documentation

NEVER rely solely on training data. Technology evolves rapidly.

### Research Triggers

Always research before:
- Creating new features or components
- Recommending tools or libraries
- Writing setup or deployment guides
- Updating security-related code
- Implementing performance optimizations
- Documenting best practices
```

---

## Red Flags: When NOT to Use Information

Ignore or research further if:

- ❌ Documentation is > 18 months old
- ❌ Tool last updated > 12 months ago
- ❌ No production examples found (< 2 real apps using it)
- ❌ Recommended package has known security issues
- ❌ Approach requires deprecated APIs
- ❌ "Tutorial hell" articles (clickbait, outdated, no sources)
- ❌ Community discussions show concerns or migration away

---

## Success Metrics

Documentation is current when:

- ✅ All setup instructions work first-try with latest SDK
- ✅ Recommended tools have commits within past 3 months
- ✅ At least 2 production apps use the documented pattern
- ✅ No open GitHub issues flagging documented approach as broken
- ✅ Community discussions (Discord, Reddit) validate approach
- ✅ Official Expo/React Native docs align with recommendations

---

## Quick Reference

| Action | Command/Tool |
|--------|--------------|
| Check official docs | WebFetch: https://docs.expo.dev/[topic]/ |
| Search best practices | WebSearch: "Expo [feature] 2026 best practices" |
| Verify tool activity | `gh repo view OWNER/REPO` |
| Find examples | WebSearch: "open source Expo [feature] GitHub" |
| Check npm health | `npm info [package]` |
| Community check | WebSearch: "[feature] Expo Reddit 2026" |

---

## Example: Researching Push Notifications (2026)

**Scenario:** You need to document push notification setup for iOS and Android.

**Research Process:**

1. **Official Docs:**
   ```bash
   WebFetch: https://docs.expo.dev/push-notifications/overview/
   WebFetch: https://docs.expo.dev/push-notifications/push-notifications-setup/
   ```

2. **Current Best Practices:**
   ```bash
   WebSearch: "expo-notifications 2026 APNS FCM setup guide"
   WebSearch: "Expo push notifications iOS Android best practices 2026"
   ```

3. **Production Examples:**
   ```bash
   WebSearch: "open source React Native app push notifications GitHub"
   gh search code "expo-notifications" --language TypeScript --stars ">100"
   ```

4. **Tool Viability:**
   ```bash
   gh repo view expo/expo --json pushedAt,stargazerCount
   npm info expo-notifications
   ```

**Key Findings (2026):**
- FCM V1 API required (V0 deprecated)
- iOS requires physical device (simulator doesn't support push)
- Development builds needed for testing (Expo Go has limitations)
- `getExpoPushTokenAsync` for Expo Push Service
- `getDevicePushTokenAsync` for direct FCM/APNs

**Document in README:**
```markdown
<!-- Updated: 2026-02-05 -->
<!-- Verified with: Expo SDK 55, expo-notifications 0.28.x -->
<!-- Sources: docs.expo.dev, GitHub@bluesky-social, Medium@fcm-setup-2026 -->
```

---

## Change Log

### 2026-02-05
- Initial guidelines created based on research best practices
- Established 3-month review cycle for core features
- Added research checklist and documentation templates
- Documented web research commands for Claude Code
- Created AI agent instructions section
- Added success metrics and red flags
- Included real-world research example

---

**Remember:** Fresh documentation prevents wasted time debugging outdated patterns. When in doubt, research it out! 🔍
