# Quickstart

> Get from zero to running app in 5 minutes. See root [QUICKSTART.md](../../QUICKSTART.md) for detailed troubleshooting.

## Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Node.js | 20+ | `node --version` |
| npm | 10+ | `npm --version` |
| Expo CLI | Latest | `npx expo --version` |
| Git | Any | `git --version` |

## Setup

```bash
# 1. Clone
git clone https://github.com/your-org/your-repo.git
cd mobile-app-blueprint

# 2. Install
npm install

# 3. Configure (optional - app works without database)
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Start
npm start
```

## Run on Device

| Platform | Method |
|----------|--------|
| iOS device | Install Expo Go, scan QR with Camera app |
| Android device | Install Expo Go, scan QR in app |
| iOS Simulator | Press `i` in terminal |
| Android Emulator | Press `a` in terminal |

## Verify Setup

```bash
# All three should pass
npm run lint
npx tsc --noEmit
npm test
```

## What's Next?

| Goal | Read This |
|------|-----------|
| Understand project rules | [CLAUDE.md](../../CLAUDE.md) |
| Build a new feature | [patterns/NEW-FEATURE.md](../patterns/NEW-FEATURE.md) |
| Add a new screen | [patterns/NEW-SCREEN.md](../patterns/NEW-SCREEN.md) |
| Set up database | [SUPABASE-SETUP.md](../03-database/SUPABASE-SETUP.md) |
| Configure authentication | [AUTH-SETUP.md](../04-authentication/AUTH-SETUP.md) |
| Review security | [SECURITY-CHECKLIST.md](../09-security/SECURITY-CHECKLIST.md) |

## Common Issues

| Issue | Quick Fix |
|-------|-----------|
| Port 8081 in use | `npx kill-port 8081 && npm start` |
| Dependencies fail | `rm -rf node_modules && npm install` |
| Expo Go won't connect | Same Wi-Fi network, try `npm start --tunnel` |
| Tests fail | `npx jest --clearCache && npm test` |

For detailed troubleshooting, see [root QUICKSTART.md](../../QUICKSTART.md#troubleshooting).
