/**
 * Deep Link Redirect: callpilot://call/[id]
 * Redirects to the pre-call briefing screen.
 */

import { useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'

export default function CallDeepLink() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  useEffect(() => {
    if (id) {
      router.replace({ pathname: '/pre-call/[contactId]', params: { contactId: id } })
    }
  }, [id, router])

  return null
}
