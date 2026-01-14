// src/features/assistant/hooks/useAssistantContext.ts
// Hook to provide structured context for AI assistant

import { useMemo } from 'react';
import { usePathname, useLocalSearchParams } from 'expo-router';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDeal } from '@/features/deals/hooks/useDeals';
import { useProperty } from '@/features/real-estate/hooks/useProperties';
import { useNextAction, NextAction } from '@/features/deals/hooks/useNextAction';
import { useDealAnalysis, DealMetrics } from '@/features/real-estate/hooks/useDealAnalysis';
import { useDealEvents } from '@/features/deals/hooks/useDealEvents';

import {
  AssistantContextSnapshot,
  ScreenContext,
  SelectionContext,
  ScreenPayload,
  DealCockpitPayload,
  PropertyDetailPayload,
  GenericPayload,
  createEmptyContext,
  UserPlan,
} from '../types/context';
import { Deal, getDealAddress, getDealLeadName, getDealRiskScore, DEAL_STAGE_CONFIG } from '@/features/deals/types';

/**
 * Map route pathname to screen name
 */
function getScreenName(pathname: string): string {
  // Extract screen name from pathname
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return 'Home';

  // Handle common routes
  if (pathname.includes('/deals/') && pathname.includes('/underwrite')) return 'QuickUnderwrite';
  if (pathname.includes('/deals/') && pathname.includes('/offer')) return 'OfferBuilder';
  if (pathname.includes('/deals/') && pathname.includes('/field-mode')) return 'FieldMode';
  if (pathname.includes('/deals/') && pathname.includes('/docs')) return 'DealDocs';
  if (pathname.includes('/deals/') && pathname.includes('/seller-report')) return 'SellerReport';
  if (pathname.includes('/deals/') && !pathname.includes('/list')) return 'DealCockpit';
  if (pathname.includes('/deals')) return 'DealsList';
  if (pathname.includes('/properties/') && !pathname.includes('/list')) return 'PropertyDetail';
  if (pathname.includes('/properties')) return 'PropertiesList';
  if (pathname.includes('/leads')) return 'LeadsList';
  if (pathname.includes('/inbox') || pathname === '/') return 'Inbox';
  if (pathname.includes('/settings')) return 'Settings';
  if (pathname.includes('/conversations')) return 'Conversations';

  // Fall back to capitalized last segment
  const lastSegment = segments[segments.length - 1];
  return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
}

/**
 * Generate one-liner summary based on context
 */
function generateSummary(
  screenName: string,
  deal?: Deal | null,
  nextAction?: NextAction | null
): string {
  if (deal) {
    const address = getDealAddress(deal);
    const stage = DEAL_STAGE_CONFIG[deal.stage]?.label || deal.stage;
    const leadName = getDealLeadName(deal);

    if (nextAction?.action) {
      return `${address} • ${stage} • Next: ${nextAction.action}`;
    }
    return `${address} • ${stage} • ${leadName}`;
  }

  switch (screenName) {
    case 'Inbox':
      return 'Your daily tasks and actions';
    case 'DealsList':
      return 'All active deals';
    case 'PropertiesList':
      return 'Property inventory';
    case 'LeadsList':
      return 'Lead contacts';
    default:
      return `Viewing ${screenName}`;
  }
}

/**
 * Build DealCockpit payload
 */
function buildDealCockpitPayload(
  deal: Deal,
  nextAction: NextAction | null,
  metrics: DealMetrics | null,
  events?: Array<{ id: string; event_type: string; title: string; created_at: string }>
): DealCockpitPayload {
  const missingInfo: DealCockpitPayload['missingInfo'] = [];

  // Check for missing data
  if (!deal.property?.arv) {
    missingInfo.push({ key: 'arv', label: 'After Repair Value', severity: 'high' });
  }
  if (!deal.property?.repair_cost) {
    missingInfo.push({ key: 'repairs', label: 'Repair Estimate', severity: 'high' });
  }
  if (!deal.strategy) {
    missingInfo.push({ key: 'strategy', label: 'Exit Strategy', severity: 'med' });
  }
  if (!deal.property?.monthly_rent && !deal.property?.estimated_rent) {
    missingInfo.push({ key: 'rent', label: 'Rent Estimate', severity: 'med' });
  }

  return {
    type: 'deal_cockpit',
    deal: {
      id: deal.id,
      stage: deal.stage,
      strategy: deal.strategy,
      nextAction: nextAction ? {
        label: nextAction.action,
        dueDate: nextAction.dueDate,
        isOverdue: nextAction.isOverdue,
      } : undefined,
      numbers: {
        mao: metrics?.mao ? {
          value: metrics.mao,
          confidence: deal.property?.arv && deal.property?.repair_cost ? 'high' : 'low',
          sourceCount: deal.evidence?.length || 0,
        } : undefined,
        profit: metrics?.netProfit ? {
          value: metrics.netProfit,
          confidence: 'med',
          sourceCount: 1,
        } : undefined,
        risk: getDealRiskScore(deal) ? {
          value: getDealRiskScore(deal)!,
          band: getDealRiskScore(deal)! <= 2 ? 'low' : getDealRiskScore(deal)! <= 3 ? 'med' : 'high',
        } : undefined,
      },
      property: deal.property ? {
        address: getDealAddress(deal),
        arv: deal.property.arv,
        repairCost: deal.property.repair_cost,
      } : undefined,
      lead: deal.lead ? {
        name: getDealLeadName(deal),
        motivation: deal.lead.notes?.[0]?.content, // Use first note as motivation placeholder
      } : undefined,
    },
    missingInfo,
    recentEvents: (events || []).map(e => ({
      eventId: e.id,
      type: e.event_type,
      title: e.title,
      ts: e.created_at,
    })),
  };
}

/**
 * Build PropertyDetail payload
 */
function buildPropertyDetailPayload(
  propertyId: string,
  property: any,
  metrics: DealMetrics | null
): PropertyDetailPayload {
  return {
    type: 'property_detail',
    propertyId,
    property: {
      address: property?.address || property?.address_line_1 || 'Unknown',
      type: property?.property_type,
      bedrooms: property?.bedrooms,
      bathrooms: property?.bathrooms,
      sqft: property?.square_feet || property?.sqft,
      yearBuilt: property?.year_built,
      arv: property?.arv,
      purchasePrice: property?.purchase_price,
      repairCost: property?.repair_cost || property?.total_repair_cost,
      status: property?.status,
    },
    analysisMetrics: metrics ? {
      mao: metrics.mao,
      profit: metrics.netProfit,
      roi: metrics.roi,
      capRate: metrics.capRate,
      cashFlow: metrics.monthlyCashFlow,
    } : undefined,
  };
}

/**
 * Build generic payload for screens without specific context
 */
function buildGenericPayload(screenName: string): GenericPayload {
  return {
    type: 'generic',
    screenName,
  };
}

/**
 * Hook options
 */
export interface UseAssistantContextOptions {
  /** Override focus mode state */
  focusMode?: boolean;
}

/**
 * Main hook to get assistant context
 */
export function useAssistantContext(
  options?: UseAssistantContextOptions
): AssistantContextSnapshot {
  const pathname = usePathname();
  const params = useLocalSearchParams<{
    dealId?: string;
    propertyId?: string;
    leadId?: string;
  }>();

  const { profile, isAuthenticated } = useAuth();

  // Get IDs from route params
  const dealId = params.dealId;
  const propertyId = params.propertyId;
  const leadId = params.leadId;

  // Fetch related data based on current screen
  const { deal } = useDeal(dealId || '');
  const { property } = useProperty(propertyId || deal?.property_id || null);

  // Get derived data
  const nextAction = useNextAction(deal);
  const metrics = useDealAnalysis(property || deal?.property || undefined);

  // Get recent events from Zone B's hook
  const { recentEvents } = useDealEvents(dealId || deal?.id);

  // Build context
  const context = useMemo<AssistantContextSnapshot>(() => {
    const screenName = getScreenName(pathname);

    const screen: ScreenContext = {
      name: screenName,
      route: pathname,
    };

    const selection: SelectionContext = {
      dealId: dealId || deal?.id,
      propertyId: propertyId || deal?.property_id,
      leadId: leadId || deal?.lead_id,
    };

    // If not authenticated, return empty context
    if (!isAuthenticated || !profile) {
      return createEmptyContext(screen, selection);
    }

    // Determine platform
    const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

    // Build payload based on screen
    let payload: ScreenPayload;

    switch (screenName) {
      case 'DealCockpit':
      case 'QuickUnderwrite':
      case 'OfferBuilder':
      case 'FieldMode':
        if (deal) {
          payload = buildDealCockpitPayload(deal, nextAction, metrics, recentEvents);
        } else {
          payload = buildGenericPayload(screenName);
        }
        break;

      case 'PropertyDetail':
        if (property) {
          payload = buildPropertyDetailPayload(propertyId || '', property, metrics);
        } else {
          payload = buildGenericPayload(screenName);
        }
        break;

      default:
        payload = buildGenericPayload(screenName);
    }

    return {
      app: {
        version: Constants.expoConfig?.version || '1.0.0',
        platform,
      },
      user: {
        id: profile.id,
        plan: (profile.role === 'admin' ? 'elite' : 'starter') as UserPlan,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      screen,
      permissions: {
        canWrite: true, // TODO: Implement proper permission checking
        canSendForESign: profile.role === 'admin',
        canGenerateReports: profile.role === 'admin' || profile.role === 'standard',
      },
      focusMode: options?.focusMode ?? false,
      selection,
      summary: {
        oneLiner: generateSummary(screenName, deal, nextAction),
        lastUpdated: new Date().toISOString(),
      },
      payload,
    };
  }, [
    pathname,
    profile,
    isAuthenticated,
    deal,
    property,
    nextAction,
    metrics,
    recentEvents,
    dealId,
    propertyId,
    leadId,
    options?.focusMode,
  ]);

  return context;
}

export default useAssistantContext;
