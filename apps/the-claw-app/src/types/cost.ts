/**
 * Cost Types
 *
 * Monthly cost tracking for AI actions and service usage.
 */

export interface CostLineItem {
  label: string
  amountCents: number
}

export interface MonthlyCostSummary {
  totalCents: number
  breakdown: CostLineItem[]
  actionCount: number
  leadsTouched: number
  dealsInfluenced?: number
  costPerLeadCents: number
}
