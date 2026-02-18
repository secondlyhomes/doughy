# Discord Bot Setup — The Claw

This guide walks through creating a Discord Bot/Application and connecting it to The Claw's existing Discord adapter.

## What Already Exists

The backend code is **100% complete** and deployed:

- **Discord adapter**: `openclaw-server/src/claw/discord.ts` — handles messages, button interactions (approve/reject), rich embeds for briefings and approvals
- **Config**: reads `DISCORD_BOT_TOKEN` and `DISCORD_CHANNEL_ID` from env
- **Server init**: `server.ts` calls `initDiscordBot()` on startup (non-blocking, skips gracefully if no token)
- **DB table**: `claw.channel_preferences` exists with `channel`, `channel_config` (JSONB), `user_id`, `is_enabled`
- **Broadcast integration**: Discord is registered as a broadcast sender for multi-channel messaging
- **User resolution**: Maps Discord user IDs to Supabase user IDs via `claw.channel_preferences`

**You do NOT need to write any server code.** You just need to create the Discord app, configure it, and set env vars.

## Step 1: Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Name it **"The Claw"** (or whatever you prefer)
4. Note the **Application ID** (you'll need this later)

## Step 2: Create the Bot

1. In your application, go to the **"Bot"** tab in the left sidebar
2. Click **"Add Bot"** → confirm
3. Under the bot settings:
   - **Username**: `The Claw` (or your preference)
   - **Icon**: Upload a bot avatar if you want
   - **Public Bot**: Turn OFF (only you should add it to servers)
   - **Message Content Intent**: Turn **ON** (required — the bot reads message content)
4. Click **"Reset Token"** → copy the token immediately
   - This is your `DISCORD_BOT_TOKEN` — save it securely, you can't see it again

## Step 3: Configure Bot Permissions

1. Go to the **"OAuth2"** tab → **"URL Generator"**
2. Under **Scopes**, check:
   - `bot`
   - `applications.commands` (if you want slash commands later)
3. Under **Bot Permissions**, check:
   - `Send Messages`
   - `Send Messages in Threads`
   - `Embed Links`
   - `Read Message History`
   - `Use External Emojis`
   - `Add Reactions`
4. Copy the generated URL at the bottom

## Step 4: Add Bot to Your Server

1. Open the URL from Step 3 in your browser
2. Select the Discord server you want to add the bot to
3. Authorize it

## Step 5: Get Channel ID

1. In Discord, go to **User Settings** → **Advanced** → enable **Developer Mode**
2. Right-click the channel where you want The Claw to operate
3. Click **"Copy Channel ID"**
4. This is your `DISCORD_CHANNEL_ID`

## Step 6: Configure Environment Variables

SSH into the server and update the env:

```bash
ssh -i ~/.ssh/id_ed25519 root@157.245.218.123
nano /var/www/openclaw/.env
```

Add these two lines:

```env
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CHANNEL_ID=your_channel_id_here
```

Then restart:

```bash
pm2 restart openclaw
```

Check logs to confirm connection:

```bash
pm2 logs openclaw --lines 20 --nostream
```

You should see:
```
[Discord] Bot connecting...
[Discord] Bot logged in as The Claw#1234
```

## Step 7: Install discord.js on the Server

The server dynamically imports `discord.js` — it needs to be installed:

```bash
cd /var/www/openclaw
npm install discord.js
pm2 restart openclaw
```

## Step 8: Link Your Discord Account

The bot needs to know which Discord user maps to which Supabase user. Insert a row into `claw.channel_preferences`:

```sql
-- Run this in the Supabase SQL Editor (staging project)
INSERT INTO claw.channel_preferences (user_id, channel, is_enabled, channel_config)
VALUES (
  '3aa71532-c4df-4b1a-aabf-6ed1d5efc7ce',  -- admin@doughy.app user ID
  'discord',
  true,
  '{"discord_user_id": "YOUR_DISCORD_USER_ID", "channel_id": "YOUR_CHANNEL_ID"}'
);
```

To get your Discord user ID: right-click your own username in Discord → "Copy User ID" (requires Developer Mode from Step 5).

## Step 9: Test

In the designated Discord channel, type:

| Message | Expected Response |
|---------|-------------------|
| `brief me` | Rich embed with portfolio briefing |
| `draft follow ups` | Embeds with approve/reject buttons per lead |
| `help` | List of available commands |
| `hello` | Greeting + brief summary |

## How It Works (for reference)

```
Discord message → discord.js listener → resolveDiscordUser() → handleClawMessage()
                                         ↓                        ↓
                            claw.channel_preferences      Same controller as SMS/WhatsApp
                            (discord_user_id → user_id)        ↓
                                                          Response → Rich embed or plain text
                                                          Approvals → Embeds with buttons
```

- **Briefings**: Detected by content heuristics, rendered as indigo embeds
- **Approvals**: Each draft gets its own embed with Approve/Reject buttons + an "Approve All" button
- **Button clicks**: `interactionCreate` handler processes approve/reject, updates DB, sends SMS via edge function
- **Broadcast**: When other channels trigger broadcasts, Discord receives them too (if user has Discord enabled)

## Intents Required

The bot uses these Gateway Intents (already configured in code):
- `Guilds` — server membership
- `GuildMessages` — messages in channels
- `MessageContent` — read message text (privileged intent, must enable in portal)
- `DirectMessages` — DM support

**IMPORTANT**: The `MessageContent` intent is a **privileged intent**. You MUST enable it in the Discord Developer Portal under Bot → Privileged Gateway Intents → Message Content Intent. Without this, the bot receives messages but `msg.content` is empty.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `[Discord] No DISCORD_BOT_TOKEN configured` | Token not in `.env` or env not loaded |
| `[Discord] discord.js not installed` | Run `npm install discord.js` in server dir |
| `[Discord] Login failed` | Invalid token — regenerate in developer portal |
| Bot online but not responding | Check `DISCORD_CHANNEL_ID` matches, or try DMs |
| `Unknown Discord user` | Need to insert `channel_preferences` row (Step 8) |
| Messages received but content empty | Enable Message Content Intent in portal (Step 2) |
