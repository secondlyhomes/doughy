/**
 * Deep Link Redirect: callpilot://message/[id]
 * Redirects to the messages/conversation screen.
 */

import { useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'

export default function MessageDeepLink() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  useEffect(() => {
    if (id) {
      router.replace({ pathname: '/messages/[contactId]', params: { contactId: id } })
    }
  }, [id, router])

  return null
}
