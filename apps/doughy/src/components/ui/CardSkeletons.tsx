/**
 * Card Skeleton Components
 *
 * Pre-styled skeleton placeholders for common card types.
 * Use these while loading data to provide visual continuity.
 *
 * @example
 * import { PropertyCardSkeleton, DealCardSkeleton } from '@/components/ui/CardSkeletons';
 *
 * // In a list
 * {isLoading ? (
 *   <>
 *     <PropertyCardSkeleton />
 *     <PropertyCardSkeleton />
 *     <PropertyCardSkeleton />
 *   </>
 * ) : (
 *   properties.map(p => <PropertyCard key={p.id} property={p} />)
 * )}
 */

export type { CardSkeletonProps } from './card-skeleton-types';
export { PropertyCardSkeleton } from './PropertyCardSkeleton';
export { DealCardSkeleton } from './DealCardSkeleton';
export { LeadCardSkeleton } from './LeadCardSkeleton';
export { DataCardSkeleton, ListItemSkeleton, SkeletonList } from './DataCardSkeleton';
export { ConversationCardSkeleton } from './ConversationCardSkeleton';
