-- Social Features Database Schema
-- Complete schema for profiles, social graph, activity feed, and notifications

-- ============================================
-- PROFILES TABLE
-- ============================================
-- Extends auth.users with additional profile information

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  website TEXT,
  location TEXT,
  followers_count INTEGER DEFAULT 0 NOT NULL,
  following_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$'),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 160),
  CONSTRAINT counts_positive CHECK (followers_count >= 0 AND following_count >= 0)
);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles(created_at DESC);

-- ============================================
-- FOLLOWS TABLE
-- ============================================
-- Social graph: who follows whom

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- Indexes for follows
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON follows(following_id);
CREATE INDEX IF NOT EXISTS follows_created_at_idx ON follows(created_at DESC);

-- ============================================
-- ACTIVITY FEED TABLE
-- ============================================
-- User activity feed

CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT valid_activity_type CHECK (
    activity_type IN ('post_created', 'post_liked', 'user_followed', 'comment_added', 'profile_updated')
  )
);

-- Indexes for activity feed
CREATE INDEX IF NOT EXISTS activity_feed_user_id_idx ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS activity_feed_actor_id_idx ON activity_feed(actor_id);
CREATE INDEX IF NOT EXISTS activity_feed_created_at_idx ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_feed_type_idx ON activity_feed(activity_type);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
-- In-app notifications

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT valid_notification_type CHECK (
    type IN ('follow', 'like', 'comment', 'mention', 'system')
  )
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications(user_id, read);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Follows Policies
CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Activity Feed Policies
CREATE POLICY "Users can view their own feed and public activities"
  ON activity_feed FOR SELECT
  USING (
    user_id = auth.uid() OR
    actor_id IN (
      SELECT following_id FROM follows WHERE follower_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activity"
  ON activity_feed FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

CREATE POLICY "Users can delete their own activity"
  ON activity_feed FOR DELETE
  USING (auth.uid() = actor_id);

-- Notifications Policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Function to increment follow counts
CREATE OR REPLACE FUNCTION increment_follow_counts(
  p_follower_id UUID,
  p_following_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Increment following count for follower
  UPDATE profiles
  SET following_count = following_count + 1
  WHERE user_id = p_follower_id;

  -- Increment followers count for following
  UPDATE profiles
  SET followers_count = followers_count + 1
  WHERE user_id = p_following_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement follow counts
CREATE OR REPLACE FUNCTION decrement_follow_counts(
  p_follower_id UUID,
  p_following_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Decrement following count for follower
  UPDATE profiles
  SET following_count = GREATEST(following_count - 1, 0)
  WHERE user_id = p_follower_id;

  -- Decrement followers count for following
  UPDATE profiles
  SET followers_count = GREATEST(followers_count - 1, 0)
  WHERE user_id = p_following_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get mutual followers
CREATE OR REPLACE FUNCTION get_mutual_followers(
  p_user_id UUID,
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.id, p.user_id, p.username, p.full_name, p.avatar_url, p.bio
  FROM profiles p
  WHERE p.user_id IN (
    SELECT f1.following_id
    FROM follows f1
    WHERE f1.follower_id = p_user_id
    AND EXISTS (
      SELECT 1 FROM follows f2
      WHERE f2.follower_id = f1.following_id
      AND f2.following_id = p_user_id
    )
  )
  ORDER BY p.username
  OFFSET p_offset
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get suggested users (friends of friends)
CREATE OR REPLACE FUNCTION get_suggested_users(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  followers_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.id, p.user_id, p.username, p.full_name, p.avatar_url, p.bio, p.followers_count
  FROM profiles p
  WHERE p.user_id IN (
    -- Users followed by people I follow
    SELECT f2.following_id
    FROM follows f1
    JOIN follows f2 ON f1.following_id = f2.follower_id
    WHERE f1.follower_id = p_user_id
    AND f2.following_id != p_user_id
    AND f2.following_id NOT IN (
      -- Exclude users I already follow
      SELECT following_id FROM follows WHERE follower_id = p_user_id
    )
  )
  ORDER BY p.followers_count DESC, p.username
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update updated_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE SETUP
-- ============================================

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
