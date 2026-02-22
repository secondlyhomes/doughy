// src/features/portfolio/screens/portfolio-screen/portfolio-screen-types.ts
// Types for the PortfolioScreen and its subcomponents

import type { PortfolioGroupWithStats, PortfolioGroup, PortfolioProperty } from '../../types';

export interface GroupedSection {
  id: string;
  title: string;
  group: PortfolioGroupWithStats | null;
  data: PortfolioProperty[];
}

export interface SectionHeaderProps {
  section: GroupedSection;
  isCollapsed: boolean;
  propertyCount: number;
  onToggleCollapse: (id: string) => void;
  onEditGroup: (group: PortfolioGroup) => void;
}
