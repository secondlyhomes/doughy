/**
 * useOrganizationSwitcher.ts
 *
 * Custom hook containing state logic for the OrganizationSwitcher component.
 */

import { useState, useCallback } from 'react'
import { useOrganization } from '../../../OrganizationContext'
import type { Organization, UseOrganizationSwitcherReturn } from '../types'

/**
 * Hook that manages organization switching state and actions.
 *
 * @returns State and handlers for the organization switcher
 */
export function useOrganizationSwitcher(): UseOrganizationSwitcherReturn {
  const { organizations, currentOrg, switchOrganization, loading } = useOrganization()
  const [modalVisible, setModalVisible] = useState(false)

  const openModal = useCallback(() => {
    setModalVisible(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalVisible(false)
  }, [])

  const handleSwitch = useCallback(
    async (org: Organization) => {
      await switchOrganization(org.id)
      setModalVisible(false)
    },
    [switchOrganization]
  )

  const handleCreateOrg = useCallback(() => {
    setModalVisible(false)
    // Navigate to create organization screen
    // This would typically use navigation from the component
  }, [])

  return {
    organizations,
    currentOrg,
    loading,
    modalVisible,
    openModal,
    closeModal,
    handleSwitch,
    handleCreateOrg,
  }
}
