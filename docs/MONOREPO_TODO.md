# Monorepo Refactoring TODO (Post-Demo)

## Phase 1: npm Workspaces
- [ ] Add `"workspaces": ["apps/*"]` to root package.json
- [ ] Deduplicate shared dependencies (expo, react, react-native, supabase-js, zustand)
- [ ] Add root convenience scripts: `start:claw`, `start:callpilot`
- [ ] Configure EAS Build monorepo detection if needed

## Phase 2: Shared Packages
- [ ] Extract `packages/design-tokens/` — single source for all 3 apps' tokens
  - Source of truth: `src/constants/design-tokens.ts`
  - Consumers: `apps/the-claw-app/src/theme/tokens.ts`, `apps/callpilot/src/theme/tokens.ts`
- [ ] Extract `packages/supabase-types/` — generated types shared across apps
  - Source: `src/integrations/supabase/types/generated.ts`
- [ ] Extract `packages/supabase-client/` — shared auth config + client init
- [ ] Consider `packages/ui/` for truly shared components (Button, Card, Badge)

## Phase 3: CI/CD
- [ ] Matrix CI: run type-check/lint/test per app (path-triggered)
- [ ] Per-app EAS Build profiles
- [ ] Turborepo for task caching (optional, evaluate need)

## Phase 4: Cleanup
- [ ] Archive `secondlyhomes/the-claw-app` repo (add redirect notice)
- [ ] Archive `secondlyhomes/callpilot` repo (add redirect notice)
- [ ] Remove template scaffolding from imported apps (marketing/, .examples/, templates/)
- [ ] Unify eslint + tsconfig base configs
