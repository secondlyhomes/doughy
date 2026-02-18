# Design Philosophy: ADHD-Friendly First

## Core Principle

Design for users with ADHD first. If it works for ADHD brains, it works for everyone.

> "Simple is the ultimate sophistication." - Leonardo da Vinci

## The 7 ADHD-Friendly Principles

### 1. No Negative Feedback - Only Celebrate Wins

**Do:**
- Celebrate task completion with confetti/animations
- Show positive streaks ("5 days in a row!")
- Award points for consistency
- Use encouraging language

**Don't:**
- Show "You failed" or "Overdue" in red
- Count days of inactivity
- Use shame or guilt messaging
- Penalize for missing days

```typescript
// GOOD
<Text>Great job! 5 tasks completed today</Text>

// BAD
<Text style={{ color: 'red' }}>3 overdue tasks!</Text>
```

### 2. Reduce Cognitive Load - One Action at a Time

**Do:**
- Show one primary action per screen
- Use progressive disclosure
- Hide advanced options in overflow menus
- Default to simple mode

**Don't:**
- Show all options at once
- Require multiple decisions simultaneously
- Use complex multi-step forms
- Overwhelm with choices

### 3. Instant Feedback - Haptics + Micro-Animations

**Timing Guidelines:**
| Feedback Type | Duration | Use Case |
|---------------|----------|----------|
| Micro | 200ms | Button press, toggle |
| Standard | 400ms | Screen transition |
| Celebration | 600ms | Task completion |
| Float | 800ms | Ambient animation |

**Always use:**
- Haptic feedback on interactions
- Visual confirmation of actions
- Spring physics (not linear)

```typescript
// Haptic on button press
import * as Haptics from 'expo-haptics';

function handlePress() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  // Then do the action
}
```

### 4. Clear Visual Hierarchy - Large Touch Targets

**Minimum Sizes:**
- Touch targets: 48pt x 48pt (Apple HIG)
- Primary buttons: 56pt height
- Icon buttons: 44pt x 44pt with hit slop

**Hierarchy:**
1. One primary CTA per screen (largest, colored)
2. Secondary actions (outlined or text)
3. Tertiary/destructive (text only, end of screen)

### 5. Gentle Motion - Spring Physics

**Do:**
- Use spring animations with natural feel
- Add subtle bounces on interactions
- Animate state changes smoothly

**Don't:**
- Use linear/easing animations (feel robotic)
- Make animations too fast or jarring
- Skip animations entirely

```typescript
// Spring animation example
Animated.spring(scaleValue, {
  toValue: 1,
  friction: 8,
  tension: 100,
  useNativeDriver: true,
}).start();
```

### 6. Safety Net - 10-Second Undo

**Every destructive action should be undoable:**

```typescript
// Delete with undo
function deleteTask(taskId: string) {
  // Move to "deleted" state, don't actually delete
  setDeletedTasks(prev => [...prev, taskId]);

  // Show undo toast
  showToast({
    message: 'Task deleted',
    action: {
      label: 'Undo',
      onPress: () => undoDelete(taskId),
    },
    duration: 10000, // 10 seconds
  });

  // Actually delete after timeout
  setTimeout(() => {
    if (isStillDeleted(taskId)) {
      permanentlyDelete(taskId);
    }
  }, 10000);
}
```

### 7. Fire and Forget - Trust the System

**Core Philosophy:**
- User speaks/acts → System handles everything → Done
- No confirmations unless truly needed
- AI is smart enough 90% of the time
- For the 10%, ask only essential questions

**Do:**
- Auto-save everything
- Smart defaults
- Learn from patterns

**Don't:**
- "Are you sure?" dialogs for reversible actions
- Multi-step confirmations
- Excessive validation warnings

## Color Psychology

| Color | Emotion | Use For |
|-------|---------|---------|
| Green (#4CAF50) | Growth, calm, focus | Primary actions |
| Emerald (#10B981) | Success, completion | Positive feedback |
| Amber (#F59E0B) | Gentle warning | Stale tasks, reminders |
| Blue (#3B82F6) | Trust, information | Links, info |

**Avoid:**
- Harsh red for warnings (use amber)
- Pure black text (use warm dark gray)
- Pure white backgrounds (use off-white #FAFAFA)

## Typography for ADHD

**Font Recommendations:**
- **Lexend** - Designed for improved readability
- **Inter** - Clean, highly legible
- **SF Pro** - iOS system font (familiar)

**Size Guidelines:**
- Body text: 16px minimum (never smaller)
- Captions: 14px only for truly secondary info
- Headers: 20px+ for clear hierarchy
- Line height: 1.5-1.6 for easy tracking

## Dark Mode (Required)

ADHD users often prefer dark mode for:
- Reduced eye strain
- Better focus
- Evening usage

**Dark Mode Colors:**
- Background: #121212 (true black for OLED)
- Surface: #1E1E1E
- Text: #F9FAFB (not pure white)
- Desaturated accent colors

## Gamification Done Right

**Positive Only:**
- Stars for completion
- Streaks for consistency
- Milestones with celebrations
- Points that accumulate (never decrease)

**Milestone Thresholds:**
```typescript
const MILESTONES = [
  { days: 3, message: "Great start! 3 days strong" },
  { days: 7, message: "One week! You're building a habit" },
  { days: 14, message: "Two weeks! Impressive consistency" },
  { days: 30, message: "One month! You're unstoppable" },
  { days: 66, message: "66 days! Habit formed!" },
];
```

## Accessibility Requirements

- Dynamic Type support (iOS)
- VoiceOver labels on all interactive elements
- Minimum 4.5:1 contrast ratio
- Respect "Reduce Motion" preference
- Support for larger text sizes

## Quick Checklist

Before shipping any screen:
- [ ] One clear primary action
- [ ] Touch targets ≥ 48pt
- [ ] Haptic feedback on interactions
- [ ] Undo available for destructive actions
- [ ] No negative/shame messaging
- [ ] Works in dark mode
- [ ] Animations use spring physics
- [ ] VoiceOver labels present
