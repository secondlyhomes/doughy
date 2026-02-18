# Social Features Example

Complete implementation of social networking features including user profiles, social graph (followers/following), activity feed, and real-time notifications.

## Features

- User Profiles with avatars and bio
- Follow/Unfollow functionality
- Followers and Following lists
- Activity feed with real-time updates
- In-app notifications
- Friend suggestions
- Privacy controls via RLS
- Optimistic UI updates
- Real-time synchronization

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Database Setup](#database-setup)
- [Components](#components)
- [Usage Examples](#usage-examples)
- [Social Graph Patterns](#social-graph-patterns)
- [Privacy & Security](#privacy--security)
- [Performance](#performance)
- [Best Practices](#best-practices)

## Quick Start

### 1. Set Up Database

Run the schema migration:

```bash
# Using Supabase CLI
supabase db push database/schema.sql

# Or run manually in SQL editor
# Copy contents of database/schema.sql to Supabase SQL Editor
```

### 2. Wrap Your App with Providers

```tsx
import { ProfileProvider } from '.examples/features/social/contexts/ProfileContext';
import { SocialProvider } from '.examples/features/social/contexts/SocialContext';
import { ActivityFeedProvider } from '.examples/features/social/contexts/ActivityFeedContext';
import { NotificationsProvider } from '.examples/features/social/contexts/NotificationsContext';

export function App() {
  const { user } = useAuth();

  return (
    <ProfileProvider>
      <SocialProvider currentUserId={user?.id}>
        <ActivityFeedProvider currentUserId={user?.id} enableRealtime>
          <NotificationsProvider currentUserId={user?.id} enableRealtime>
            <Navigation />
          </NotificationsProvider>
        </ActivityFeedProvider>
      </SocialProvider>
    </ProfileProvider>
  );
}
```

### 3. Use Components

```tsx
import { ProfileScreen } from '.examples/features/social/screens/ProfileScreen';
import { ActivityFeed } from '.examples/features/social/components/ActivityFeed';
import { NotificationsList } from '.examples/features/social/components/NotificationsList';

function HomeScreen() {
  return (
    <View>
      <ActivityFeed
        onProfilePress={(userId) => navigation.navigate('Profile', { userId })}
      />
    </View>
  );
}
```

## Architecture

### Directory Structure

```
social/
├── types/              # TypeScript type definitions
│   └── index.ts
├── services/           # Business logic and API calls
│   ├── profileService.ts
│   ├── socialService.ts
│   ├── activityService.ts
│   └── notificationService.ts
├── contexts/           # React Context providers
│   ├── ProfileContext.tsx
│   ├── SocialContext.tsx
│   ├── ActivityFeedContext.tsx
│   └── NotificationsContext.tsx
├── components/         # Reusable UI components
│   ├── AvatarUpload.tsx
│   ├── FollowButton.tsx
│   ├── FollowersList.tsx
│   ├── FollowingList.tsx
│   ├── FeedItem.tsx
│   ├── ActivityFeed.tsx
│   ├── NotificationItem.tsx
│   └── NotificationsList.tsx
├── screens/            # Complete screen components
│   ├── ProfileScreen.tsx
│   └── EditProfileScreen.tsx
├── database/           # Database schema
│   └── schema.sql
└── README.md
```

### Data Flow

```
User Action
    ↓
Component (Optimistic Update)
    ↓
Context Hook
    ↓
Service Function
    ↓
Supabase API
    ↓
Database (with RLS)
    ↓
Real-time Subscription
    ↓
Context State Update
    ↓
UI Re-render
```

## Database Setup

### Tables

#### `profiles`
Extended user profiles with social stats:
- Basic info: username, full_name, bio, avatar_url
- Location and website
- Follower/following counts
- Timestamps

#### `follows`
Social graph relationships:
- follower_id: User who follows
- following_id: User being followed
- Unique constraint prevents duplicates
- Check constraint prevents self-follows

#### `activity_feed`
User activity events:
- user_id: Owner of the feed
- actor_id: User who performed action
- activity_type: Type of activity
- content: Additional data (JSONB)

#### `notifications`
In-app notifications:
- user_id: Recipient
- type: Notification type
- title & message: Display text
- read: Read status
- data: Additional context (JSONB)

### RLS Policies

All tables have Row Level Security enabled:

**Profiles:**
- Public read access
- Users can only edit their own profile

**Follows:**
- Public read access
- Users can only create/delete their own follows

**Activity Feed:**
- Users see own activities + activities from followed users
- Users can only create/delete their own activities

**Notifications:**
- Users see only their own notifications
- System can create notifications for any user

### Database Functions

**increment_follow_counts / decrement_follow_counts:**
- Atomically update follower counts
- Prevents race conditions
- Called automatically when following/unfollowing

**get_mutual_followers:**
- Returns users who follow each other
- Useful for "friends" list

**get_suggested_users:**
- Friends-of-friends algorithm
- Sorted by popularity
- Excludes already followed users

## Components

### Profile Components

#### `AvatarUpload`
Avatar management with image picker and camera support.

```tsx
<AvatarUpload
  userId={user.id}
  currentAvatarUrl={profile.avatar_url}
  onUploadSuccess={(url) => console.log('Uploaded:', url)}
  size={120}
  editable
/>
```

#### `ProfileScreen`
Complete profile view with stats, bio, and follow button.

```tsx
<ProfileScreen
  userId={targetUserId}
  currentUserId={currentUser.id}
  onEditProfile={() => navigation.navigate('EditProfile')}
  onFollowersPress={() => navigation.navigate('Followers', { userId })}
/>
```

#### `EditProfileScreen`
Profile editing with form validation.

```tsx
<EditProfileScreen
  onSave={() => navigation.goBack()}
  onCancel={() => navigation.goBack()}
/>
```

### Social Components

#### `FollowButton`
Smart follow/unfollow button with loading states.

```tsx
<FollowButton userId={targetUser.id} size="medium" />
```

Features:
- Auto-checks follow relationship
- Optimistic updates
- Loading and error states
- Three sizes: small, medium, large

#### `FollowersList` / `FollowingList`
Lists of followers or following with follow buttons.

```tsx
<FollowersList
  userId={user.id}
  onProfilePress={(profile) => navigation.navigate('Profile', { userId: profile.id })}
/>
```

### Activity Feed Components

#### `FeedItem`
Single activity feed item.

```tsx
<FeedItem
  activity={activity}
  onProfilePress={(userId) => navigate('Profile', { userId })}
  onContentPress={(activity) => handleActivityPress(activity)}
/>
```

#### `ActivityFeed`
Complete feed with pagination and real-time updates.

```tsx
<ActivityFeed
  onProfilePress={(userId) => navigate('Profile', { userId })}
/>
```

Features:
- Pull-to-refresh
- Infinite scroll
- Real-time updates
- Loading states
- Empty states

### Notification Components

#### `NotificationItem`
Single notification with icon and read status.

```tsx
<NotificationItem
  notification={notification}
  onPress={(n) => handlePress(n)}
  onDelete={(id) => deleteNotification(id)}
/>
```

#### `NotificationsList`
Complete notifications list with mark as read.

```tsx
<NotificationsList
  onNotificationPress={(n) => handleNotificationPress(n)}
/>
```

Features:
- Unread count badge
- Mark all as read
- Individual delete
- Pull-to-refresh
- Real-time updates

## Usage Examples

### Creating a Profile

```tsx
import { useProfile } from './contexts/ProfileContext';

function SetupProfileScreen() {
  const { updateProfile } = useProfile();

  const handleSubmit = async () => {
    await updateProfile({
      username: 'johndoe',
      full_name: 'John Doe',
      bio: 'Software developer',
      location: 'San Francisco, CA',
    });
  };

  return <ProfileForm onSubmit={handleSubmit} />;
}
```

### Following Users

```tsx
import { useSocial } from './contexts/SocialContext';

function UserCard({ user }) {
  const { followUser, unfollowUser, getFollowRelationship } = useSocial();
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    checkRelationship();
  }, [user.id]);

  const checkRelationship = async () => {
    const rel = await getFollowRelationship(user.id);
    setIsFollowing(rel.isFollowing);
  };

  const handleToggleFollow = async () => {
    if (isFollowing) {
      await unfollowUser(user.id);
    } else {
      await followUser(user.id);
    }
    setIsFollowing(!isFollowing);
  };

  return (
    <View>
      <Text>{user.username}</Text>
      <Button onPress={handleToggleFollow}>
        {isFollowing ? 'Unfollow' : 'Follow'}
      </Button>
    </View>
  );
}
```

### Creating Activities

```tsx
import { useActivityFeed } from './contexts/ActivityFeedContext';

function CreatePostScreen() {
  const { createActivity } = useActivityFeed();

  const handlePublish = async (post) => {
    await createActivity('post_created', {
      postId: post.id,
      title: post.title,
      text: post.content,
    });

    navigation.navigate('Feed');
  };

  return <PostForm onPublish={handlePublish} />;
}
```

### Sending Notifications

```tsx
import { createNotification } from './services/notificationService';

async function notifyUserOfLike(userId, likerId, postId) {
  await createNotification(
    userId,
    'like',
    'New Like',
    'Someone liked your post',
    { likerId, postId }
  );
}
```

## Social Graph Patterns

### Follow Relationship

```tsx
const relationship = await getFollowRelationship(userId);

if (relationship.isMutual) {
  // Both users follow each other (friends)
} else if (relationship.isFollowing) {
  // Current user follows target
} else if (relationship.isFollowedBy) {
  // Target follows current user
}
```

### Mutual Followers (Friends)

```tsx
import { getMutualFollowers } from './services/socialService';

const friends = await getMutualFollowers(userId, 0, 20);
// Returns users who both follow and are followed by userId
```

### Friend Suggestions

```tsx
import { getSuggestedUsers } from './services/socialService';

const suggestions = await getSuggestedUsers(userId, 10);
// Returns friends-of-friends, sorted by popularity
```

### Checking Multiple Follows

```tsx
import { checkMultipleFollows } from './services/socialService';

const userIds = ['user1', 'user2', 'user3'];
const followMap = await checkMultipleFollows(currentUserId, userIds);
// { user1: true, user2: false, user3: true }
```

## Privacy & Security

### Row Level Security

All operations enforce RLS policies:

```sql
-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Users only see notifications meant for them
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);
```

### Privacy Controls

**Profile Visibility:**
- All profiles are public by default
- Consider adding a `is_private` flag for private accounts

**Activity Feed:**
- Users see own activities + activities from followed users
- Private posts can be filtered at the application level

**Notifications:**
- Strictly private (only visible to recipient)
- No cross-user data leakage

### Best Practices

1. **Never disable RLS** - Even temporarily
2. **Use service role key only on server** - Never in client code
3. **Validate all inputs** - Check constraints in database
4. **Rate limit follow operations** - Prevent spam
5. **Moderate usernames** - Check for inappropriate content

## Performance

### Optimization Strategies

#### 1. Denormalized Counts

Follower/following counts are stored on profiles:
- No expensive COUNT queries
- Updated atomically with triggers
- Always consistent

#### 2. Efficient Indexes

```sql
-- Composite index for common query
CREATE INDEX notifications_user_read_idx
ON notifications(user_id, read);

-- Descending index for time-based queries
CREATE INDEX activity_feed_created_at_idx
ON activity_feed(created_at DESC);
```

#### 3. Pagination

Always use offset/limit:

```tsx
const activities = await getActivityFeed(userId, offset, limit);
```

#### 4. Real-time Subscriptions

Subscribe only to relevant data:

```tsx
// Only subscribe to current user's notifications
subscribeToNotifications(currentUserId, {
  onInsert: (notification) => {
    // Handle new notification
  }
});
```

#### 5. Optimistic Updates

Update UI immediately, sync later:

```tsx
// Immediately update UI
setIsFollowing(true);

try {
  // Sync with server
  await followUser(userId);
} catch (error) {
  // Revert on error
  setIsFollowing(false);
}
```

### Caching Strategies

1. **Profile caching** - Cache profiles in memory
2. **Follow relationship caching** - Store in context
3. **Activity feed caching** - Use React Query or similar
4. **Notification badge** - Update via real-time only

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```tsx
try {
  await followUser(userId);
} catch (error) {
  if (error.message === 'Already following this user') {
    // Handle duplicate follow
  } else {
    // Show generic error
    Alert.alert('Error', 'Failed to follow user');
  }
}
```

### 2. Loading States

Show appropriate loading indicators:

```tsx
if (loading && !profile) {
  return <LoadingSpinner />;
}

// Show partial data while loading more
return (
  <>
    <ProfileData profile={profile} />
    {loading && <LoadingIndicator />}
  </>
);
```

### 3. Empty States

Provide helpful empty states:

```tsx
if (followers.length === 0) {
  return (
    <EmptyState
      icon="👥"
      title="No followers yet"
      description="Share your profile to gain followers"
    />
  );
}
```

### 4. Real-time Updates

Clean up subscriptions:

```tsx
useEffect(() => {
  const unsubscribe = subscribeToActivityFeed(userId, handleInsert);

  return () => {
    unsubscribe(); // Clean up on unmount
  };
}, [userId]);
```

### 5. Validation

Validate all user inputs:

```tsx
if (!username.trim()) {
  throw new Error('Username is required');
}

if (username.length < 3 || username.length > 30) {
  throw new Error('Username must be 3-30 characters');
}

if (!/^[a-zA-Z0-9_]+$/.test(username)) {
  throw new Error('Username can only contain letters, numbers, and underscores');
}
```

### 6. Accessibility

Make components accessible:

```tsx
<Pressable
  accessibilityLabel={`Follow ${user.username}`}
  accessibilityRole="button"
  accessibilityState={{ checked: isFollowing }}
>
  <Text>{isFollowing ? 'Following' : 'Follow'}</Text>
</Pressable>
```

## Testing

### Unit Tests

Test services in isolation:

```tsx
describe('profileService', () => {
  it('should update profile', async () => {
    const updated = await updateProfile(userId, {
      bio: 'New bio',
    });

    expect(updated.bio).toBe('New bio');
  });
});
```

### Integration Tests

Test context interactions:

```tsx
describe('ProfileContext', () => {
  it('should load and update profile', async () => {
    const { result } = renderHook(() => useProfile());

    await act(async () => {
      await result.current.loadProfile(userId);
    });

    expect(result.current.profile).toBeDefined();
  });
});
```

### E2E Tests

Test complete user flows:

```tsx
describe('Follow flow', () => {
  it('should follow and unfollow user', async () => {
    // Navigate to profile
    await element(by.id('user-card')).tap();

    // Follow user
    await element(by.id('follow-button')).tap();
    await expect(element(by.text('Following'))).toBeVisible();

    // Unfollow user
    await element(by.id('follow-button')).tap();
    await expect(element(by.text('Follow'))).toBeVisible();
  });
});
```

## Troubleshooting

### Common Issues

**Issue: "Already following this user" error**
- Check if follow relationship already exists
- Handle duplicate follows gracefully

**Issue: Counts don't update**
- Verify RPC functions are called
- Check trigger execution
- Ensure RLS allows updates

**Issue: Real-time not working**
- Check subscription filters
- Verify RLS policies
- Enable replication for table

**Issue: Avatar upload fails**
- Check storage bucket exists
- Verify storage policies
- Check file size limits

### Debug Tips

1. Enable Supabase debug mode:
```tsx
const supabase = createClient(url, key, {
  auth: { debug: true }
});
```

2. Log all errors:
```tsx
try {
  await followUser(userId);
} catch (error) {
  console.error('Follow error:', error);
  console.error('Error code:', error.code);
  console.error('Error details:', error.details);
}
```

3. Check database logs in Supabase dashboard

## Next Steps

- [ ] Add private accounts
- [ ] Implement blocking
- [ ] Add friend recommendations algorithm
- [ ] Create analytics dashboard
- [ ] Add activity filters
- [ ] Implement notification preferences
- [ ] Add rich notifications (images, etc.)
- [ ] Create admin moderation tools

## Resources

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [React Native Image Picker](https://github.com/react-native-image-picker/react-native-image-picker)
- [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
