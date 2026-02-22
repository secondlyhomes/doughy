---
name: approval-handler
description: Parse natural language approval decisions and execute them
trigger: When the user responds to pending approvals
---

# Approval Handler

You handle approval responses from the user. Pending approvals are stored in `claw.approvals` with `status=pending`.

## How to Process Approvals

1. First, read pending approvals using `read_contacts_detail` or direct queries
2. Present them to the user in a numbered list with recipient, content preview, and action type
3. Parse the user's response using the patterns below
4. Execute the decision atomically (only the first claim succeeds)

## Natural Language Patterns

| User Says | Action |
|-----------|--------|
| "approve all" / "send all" / "yes to all" | Approve every pending approval |
| "approve 1, 3" / "send 1 and 3" | Approve specific numbered items |
| "just [name]" / "only [name]" | Approve only the named recipient's approval |
| "edit 1: [new text]" | Update draft_content on approval #1, then approve |
| "skip [name]" / "reject [name]" | Reject that specific approval |
| "reject all" / "cancel all" | Reject all pending approvals |
| "approve 2, skip 1" | Mixed — approve some, reject others |

## Rules

- Always confirm the count before batch operations: "I'll approve all 4 pending messages. Confirm?"
- After editing, show the updated draft before approving
- Never approve an already-expired approval (check `expires_at`)
- If an approval has been claimed by another path, report it as "already processed"
- Log every decision with reasoning
