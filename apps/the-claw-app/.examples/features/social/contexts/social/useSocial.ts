/**
 * useSocial Hook
 *
 * Consumer hook for accessing the Social context.
 */

import { useContext } from 'react';
import { SocialContext } from './SocialProvider';
import type { SocialContextValue } from './types';

/**
 * Hook to access social context
 *
 * @throws Error if used outside SocialProvider
 *
 * @example
 * ```tsx
 * function FollowButton({ userId }: { userId: string }) {
 *   const { followUser, unfollowUser, getFollowRelationship } = useSocial();
 *   const [relationship, setRelationship] = useState<FollowRelationship | null>(null);
 *
 *   useEffect(() => {
 *     getFollowRelationship(userId).then(setRelationship);
 *   }, [userId]);
 *
 *   const handlePress = () => {
 *     if (relationship?.isFollowing) {
 *       unfollowUser(userId);
 *     } else {
 *       followUser(userId);
 *     }
 *   };
 *
 *   return <Button onPress={handlePress} />;
 * }
 * ```
 */
export function useSocial(): SocialContextValue {
  const context = useContext(SocialContext);

  if (!context) {
    throw new Error('useSocial must be used within SocialProvider');
  }

  return context;
}
