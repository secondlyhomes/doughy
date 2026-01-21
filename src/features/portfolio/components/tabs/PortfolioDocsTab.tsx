// src/features/portfolio/components/tabs/PortfolioDocsTab.tsx
// Documents tab showing categorized documents with search

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, SectionList } from 'react-native';
import {
  FileText,
  Search,
  Plus,
  FolderOpen,
  Shield,
  FileSignature,
  Home,
  Receipt,
  Landmark,
  ClipboardCheck,
  Wrench,
  File,
  ChevronRight,
  Upload,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { SPACING } from '@/constants/design-tokens';
import type { PortfolioDocumentCategory, PortfolioDocument } from '../../types';

// Temporary: We'll need to create a usePortfolioDocuments hook
// For now, using a placeholder implementation

interface PortfolioDocsTabProps {
  portfolioEntryId?: string;
  propertyId?: string;
}

const CATEGORY_CONFIG: Record<PortfolioDocumentCategory, {
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
}> = {
  insurance: { label: 'Insurance', icon: Shield },
  lease: { label: 'Lease', icon: FileSignature },
  title_deed: { label: 'Title & Deed', icon: Home },
  tax_records: { label: 'Tax Records', icon: Receipt },
  mortgage: { label: 'Mortgage', icon: Landmark },
  inspection: { label: 'Inspection', icon: ClipboardCheck },
  repair_receipts: { label: 'Repair Receipts', icon: Wrench },
  other: { label: 'Other', icon: File },
};

export function PortfolioDocsTab({
  portfolioEntryId,
  propertyId,
}: PortfolioDocsTabProps) {
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['insurance', 'lease']));

  // Placeholder: In a real implementation, this would come from usePortfolioDocuments hook
  const documents: PortfolioDocument[] = [];
  const isLoading = false;

  // Group documents by category
  const documentsByCategory = useMemo(() => {
    const filtered = searchQuery
      ? documents.filter(
          (doc) =>
            doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : documents;

    const grouped = new Map<PortfolioDocumentCategory, PortfolioDocument[]>();

    for (const doc of filtered) {
      const existing = grouped.get(doc.category) || [];
      grouped.set(doc.category, [...existing, doc]);
    }

    return grouped;
  }, [documents, searchQuery]);

  // Convert to section list data
  const sections = useMemo(() => {
    return Object.entries(CATEGORY_CONFIG)
      .map(([category, config]) => ({
        category: category as PortfolioDocumentCategory,
        title: config.label,
        icon: config.icon,
        data: documentsByCategory.get(category as PortfolioDocumentCategory) || [],
      }))
      .filter((section) => section.data.length > 0 || !searchQuery);
  }, [documentsByCategory, searchQuery]);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleUploadDocument = useCallback((category?: PortfolioDocumentCategory) => {
    // TODO: Implement document upload
    console.log('Upload document to category:', category);
  }, []);

  const handleViewDocument = useCallback((doc: PortfolioDocument) => {
    // TODO: Implement document viewing
    console.log('View document:', doc);
  }, []);

  if (!portfolioEntryId && !propertyId) {
    return (
      <View className="py-8 items-center">
        <Text style={{ color: colors.mutedForeground }}>
          No property found.
        </Text>
      </View>
    );
  }

  return (
    <View className="py-4 gap-4 pb-6">
      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search documents..."
        size="md"
      />

      {/* Document Categories */}
      {documents.length > 0 ? (
        <View className="gap-3">
          {sections.map((section) => {
            const isExpanded = expandedCategories.has(section.category);
            const Icon = section.icon;

            return (
              <Card key={section.category}>
                <TouchableOpacity
                  onPress={() => toggleCategory(section.category)}
                  className="flex-row justify-between items-center p-4"
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className="w-10 h-10 rounded-lg items-center justify-center"
                      style={{ backgroundColor: colors.primary + '20' }}
                    >
                      <Icon size={20} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '600' }}>
                        {section.title}
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                        {section.data.length} document{section.data.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight
                    size={20}
                    color={colors.mutedForeground}
                    style={{
                      transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
                    }}
                  />
                </TouchableOpacity>

                {isExpanded && section.data.length > 0 && (
                  <View className="px-4 pb-4 gap-2">
                    {section.data.map((doc) => (
                      <TouchableOpacity
                        key={doc.id}
                        onPress={() => handleViewDocument(doc)}
                        className="flex-row items-center justify-between py-2 px-3 rounded-lg"
                        style={{ backgroundColor: colors.muted }}
                      >
                        <View className="flex-row items-center gap-3 flex-1">
                          <FileText size={16} color={colors.mutedForeground} />
                          <View className="flex-1">
                            <Text
                              style={{ color: colors.foreground, fontSize: 14 }}
                              numberOfLines={1}
                            >
                              {doc.filename}
                            </Text>
                            {doc.description && (
                              <Text
                                style={{ color: colors.mutedForeground, fontSize: 12 }}
                                numberOfLines={1}
                              >
                                {doc.description}
                              </Text>
                            )}
                          </View>
                        </View>
                        <ChevronRight size={16} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                      onPress={() => handleUploadDocument(section.category)}
                      className="flex-row items-center justify-center py-2 px-3 rounded-lg border border-dashed"
                      style={{ borderColor: colors.border }}
                    >
                      <Plus size={16} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontSize: 13, marginLeft: 4 }}>
                        Add Document
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      ) : (
        <Card>
          <CardContent className="py-12 items-center">
            <FolderOpen size={48} color={colors.mutedForeground} />
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '600', marginTop: SPACING.lg }}>
              No Documents Yet
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 14, marginTop: SPACING.sm, textAlign: 'center', maxWidth: 280 }}>
              Upload important documents like insurance policies, leases, title deeds, and receipts.
            </Text>
            <Button
              variant="default"
              size="default"
              onPress={() => handleUploadDocument()}
              className="mt-6"
            >
              <Upload size={18} color="white" />
              <Text style={{ color: 'white', marginLeft: 8, fontWeight: '600' }}>
                Upload Document
              </Text>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Upload by Category */}
      {documents.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex-row items-center gap-2">
              <FileText size={18} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                Suggested Documents
              </Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View className="gap-2">
              {Object.entries(CATEGORY_CONFIG)
                .slice(0, 5)
                .map(([category, config]) => {
                  const Icon = config.icon;
                  return (
                    <TouchableOpacity
                      key={category}
                      onPress={() => handleUploadDocument(category as PortfolioDocumentCategory)}
                      className="flex-row items-center justify-between py-3 px-3 rounded-lg"
                      style={{ backgroundColor: colors.muted }}
                    >
                      <View className="flex-row items-center gap-3">
                        <Icon size={18} color={colors.primary} />
                        <Text style={{ color: colors.foreground, fontSize: 14 }}>
                          {config.label}
                        </Text>
                      </View>
                      <Plus size={18} color={colors.primary} />
                    </TouchableOpacity>
                  );
                })}
            </View>
          </CardContent>
        </Card>
      )}
    </View>
  );
}

export default PortfolioDocsTab;
