/**
 * PlanDetails Component
 *
 * Displays subscription plan details including status and renewal info
 */

import React from 'react'
import { View } from 'react-native'
import { styles } from '../styles'
import { DetailRow } from './DetailRow'
import type { PlanDetailsProps } from '../types'

export function PlanDetails({ subscription, daysUntilRenewal, theme }: PlanDetailsProps) {
  const renewalDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : 'N/A'

  return (
    <View style={styles.details}>
      <DetailRow
        label="Status"
        value={subscription?.status || 'Unknown'}
        theme={theme}
      />
      <DetailRow
        label={subscription?.cancelAt ? 'Active until' : 'Renews on'}
        value={renewalDate}
        theme={theme}
      />
      {daysUntilRenewal !== null && (
        <DetailRow
          label="Days until renewal"
          value={`${daysUntilRenewal} days`}
          theme={theme}
        />
      )}
    </View>
  )
}
