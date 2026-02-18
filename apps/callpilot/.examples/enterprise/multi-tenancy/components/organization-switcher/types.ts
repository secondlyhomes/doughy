/**
 * types.ts
 *
 * TypeScript interfaces for the OrganizationSwitcher component.
 */

import type { ImageSourcePropType } from 'react-native'

/**
 * Organization entity representing a single organization.
 */
export interface Organization {
  id: string
  name: string
  role: string
  logo_url?: string
}

/**
 * Props for the OrgLogo component.
 */
export interface OrgLogoProps {
  logoUrl?: string
  name: string
  size?: 'small' | 'medium'
}

/**
 * Props for the OrgListItem component.
 */
export interface OrgListItemProps {
  organization: Organization
  isActive: boolean
  onPress: (org: Organization) => void
}

/**
 * Props for the CreateOrgButton component.
 */
export interface CreateOrgButtonProps {
  onPress: () => void
}

/**
 * Return type for the useOrganizationSwitcher hook.
 */
export interface UseOrganizationSwitcherReturn {
  organizations: Organization[]
  currentOrg: Organization | null
  loading: boolean
  modalVisible: boolean
  openModal: () => void
  closeModal: () => void
  handleSwitch: (org: Organization) => Promise<void>
  handleCreateOrg: () => void
}
