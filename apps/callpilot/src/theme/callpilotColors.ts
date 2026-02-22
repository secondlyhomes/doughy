/**
 * CallPilot Semantic Colors
 *
 * Maps domain concepts to existing theme token colors.
 * Uses the blueprint's existing color scales - no new hex values needed.
 */

import { colors } from './tokens';

export const callpilotColors = {
  /** Pre-call briefs, insights, coaching - uses info blue */
  brief: colors.info,

  /** Warnings, follow-ups due, attention needed - uses warning amber */
  attention: colors.warning,

  /** Won deals, positive outcomes - uses success green */
  positive: colors.success,

  /** Lost deals (analytics only, never in active flows) - uses error red */
  negative: colors.error,

  /** Outcome badge colors mapped to call outcomes */
  outcome: {
    won: colors.success[500],
    progressed: colors.info[500],
    stalled: colors.warning[500],
    lost: colors.error[500],
    follow_up: colors.warning[400],
  },

  /** Sentiment indicator colors */
  sentiment: {
    positive: colors.success[500],
    neutral: colors.info[400],
    negative: colors.warning[500],
  },

  /** Relationship strength colors */
  relationship: {
    new: colors.neutral[400],
    building: colors.info[400],
    established: colors.info[500],
    strong: colors.success[500],
  },

  /** Key moment type colors */
  moment: {
    objection: colors.warning[500],
    interest: colors.success[500],
    commitment: colors.success[600],
    concern: colors.warning[400],
    question: colors.info[400],
  },
  /** Communication channel colors */
  channel: {
    call: colors.success[500],
    sms: colors.info[500],
    email: colors.warning[500],
    transcript: colors.info[400],
  },
  /** Coaching suggestion category colors */
  coaching: {
    opener: colors.success[500],
    objection_response: colors.warning[500],
    closing: colors.info[500],
    discovery: colors.primary[500],
    value_prop: colors.success[600],
  },

  /** Contact temperature colors */
  temperature: {
    hot: colors.error[500],
    warm: colors.warning[500],
    cold: colors.info[500],
  },
} as const;

export type CallPilotColors = typeof callpilotColors;
