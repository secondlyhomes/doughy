// src/components/ui/message-bubble-helpers.ts
// Time formatting helpers for MessageBubble

// Format time in absolute format (e.g., "2:30 PM")
export function formatTimeAbsolute(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Format time in relative format (e.g., "2m ago", "Just now")
export function formatTimeRelative(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return `${hours}h ago`;
  }

  // Fallback to absolute for older messages
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
