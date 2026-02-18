/**
 * OrganizationSwitcher.tsx
 *
 * Component for switching between organizations.
 * Shows current organization and list of available organizations.
 *
 * Usage:
 * ```tsx
 * <OrganizationSwitcher />
 * ```
 */

import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native'
import { styles } from './styles'
import { useOrganizationSwitcher } from './hooks/useOrganizationSwitcher'
import { OrgLogo } from './components/OrgLogo'
import { OrgListItem } from './components/OrgListItem'
import { CreateOrgButton } from './components/CreateOrgButton'

/**
 * Organization switcher component with modal picker.
 *
 * Displays the current organization with a dropdown to switch
 * between available organizations.
 */
export function OrganizationSwitcher() {
  const {
    organizations,
    currentOrg,
    loading,
    modalVisible,
    openModal,
    closeModal,
    handleSwitch,
    handleCreateOrg,
  } = useOrganizationSwitcher()

  if (loading) {
    return <ActivityIndicator />
  }

  if (!currentOrg) {
    return <Text>No organization selected</Text>
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.currentOrg} onPress={openModal}>
        <View style={styles.orgInfo}>
          <OrgLogo logoUrl={currentOrg.logo_url} name={currentOrg.name} size="small" />

          <View style={styles.orgDetails}>
            <Text style={styles.orgName}>{currentOrg.name}</Text>
            <Text style={styles.orgRole}>{currentOrg.role}</Text>
          </View>
        </View>

        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Switch Organization</Text>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={organizations}
              keyExtractor={(item) => item.id}
              renderItem={({ item: org }) => (
                <OrgListItem
                  organization={org}
                  isActive={org.id === currentOrg.id}
                  onPress={handleSwitch}
                />
              )}
            />

            <CreateOrgButton onPress={handleCreateOrg} />
          </View>
        </View>
      </Modal>
    </View>
  )
}
