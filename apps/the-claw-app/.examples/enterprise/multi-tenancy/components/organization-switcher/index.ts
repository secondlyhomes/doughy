/**
 * index.ts
 *
 * Clean re-exports for the OrganizationSwitcher component.
 */

// Main component
export { OrganizationSwitcher } from './OrganizationSwitcher'

// Types
export type {
  Organization,
  OrgLogoProps,
  OrgListItemProps,
  CreateOrgButtonProps,
  UseOrganizationSwitcherReturn,
} from './types'

// Sub-components (for advanced usage)
export { OrgLogo } from './components/OrgLogo'
export { OrgListItem } from './components/OrgListItem'
export { CreateOrgButton } from './components/CreateOrgButton'

// Hook (for custom implementations)
export { useOrganizationSwitcher } from './hooks/useOrganizationSwitcher'
