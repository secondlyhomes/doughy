// src/features/portfolio/screens/portfolio-property-detail/PropertyDetailTabs.tsx

import React from 'react';
import { View, Text } from 'react-native';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { PortfolioPerformanceTab } from '../../components/tabs/PortfolioPerformanceTab';
import { PortfolioFinancialsTab } from '../../components/tabs/PortfolioFinancialsTab';
import { PortfolioDebtTab } from '../../components/tabs/PortfolioDebtTab';
import { PortfolioValuationsTab } from '../../components/tabs/PortfolioValuationsTab';
import { PortfolioDocsTab } from '../../components/tabs/PortfolioDocsTab';
import type {
  PortfolioEntry,
  PortfolioPropertyPerformance,
  PortfolioBenchmark,
} from '../../types';
import { TabValue, ThemeColors } from './portfolio-property-detail-types';

interface PropertyDetailTabsProps {
  activeTab: TabValue;
  onTabChange: (value: string) => void;
  portfolioEntryId: string | undefined;
  propertyId: string;
  entry: PortfolioEntry | undefined;
  performance: PortfolioPropertyPerformance | null | undefined;
  benchmark: PortfolioBenchmark | undefined;
  colors: ThemeColors;
}

export function PropertyDetailTabs({
  activeTab,
  onTabChange,
  portfolioEntryId,
  propertyId,
  entry,
  performance,
  benchmark,
  colors,
}: PropertyDetailTabsProps) {
  return (
    <View className="px-4 mt-2">
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList>
          <TabsTrigger value="performance">
            <Text style={{ color: activeTab === 'performance' ? colors.foreground : colors.mutedForeground, fontSize: 13, fontWeight: '500' }}>
              Performance
            </Text>
          </TabsTrigger>
          <TabsTrigger value="financials">
            <Text style={{ color: activeTab === 'financials' ? colors.foreground : colors.mutedForeground, fontSize: 13, fontWeight: '500' }}>
              Financials
            </Text>
          </TabsTrigger>
          <TabsTrigger value="debt">
            <Text style={{ color: activeTab === 'debt' ? colors.foreground : colors.mutedForeground, fontSize: 13, fontWeight: '500' }}>
              Debt
            </Text>
          </TabsTrigger>
          <TabsTrigger value="valuations">
            <Text style={{ color: activeTab === 'valuations' ? colors.foreground : colors.mutedForeground, fontSize: 13, fontWeight: '500' }}>
              Values
            </Text>
          </TabsTrigger>
          <TabsTrigger value="docs">
            <Text style={{ color: activeTab === 'docs' ? colors.foreground : colors.mutedForeground, fontSize: 13, fontWeight: '500' }}>
              Docs
            </Text>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="performance">
          <PortfolioPerformanceTab
            portfolioEntryId={portfolioEntryId}
            performance={performance}
            benchmark={benchmark}
          />
        </TabsContent>

        <TabsContent value="financials">
          <PortfolioFinancialsTab
            portfolioEntryId={portfolioEntryId}
            entry={entry}
          />
        </TabsContent>

        <TabsContent value="debt">
          <PortfolioDebtTab
            portfolioEntryId={portfolioEntryId}
          />
        </TabsContent>

        <TabsContent value="valuations">
          <PortfolioValuationsTab
            propertyId={propertyId}
            acquisitionPrice={entry?.acquisition_price}
            acquisitionDate={entry?.acquisition_date}
          />
        </TabsContent>

        <TabsContent value="docs">
          <PortfolioDocsTab
            portfolioEntryId={portfolioEntryId}
            propertyId={propertyId}
          />
        </TabsContent>
      </Tabs>
    </View>
  );
}
