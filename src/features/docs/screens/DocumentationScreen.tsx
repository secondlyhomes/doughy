// src/features/docs/screens/DocumentationScreen.tsx
// Documentation page with sidebar navigation
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import {
  Home,
  Zap,
  FileText,
  MessageSquare,
  Calculator,
  BarChart2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Search,
  PenTool,
  Settings,
  Database,
} from 'lucide-react-native';
import { useTheme, useThemeColors } from '@/context/ThemeContext';
import {
  documentationData,
  getDocContent,
  getDocPageBySlug,
  getAdjacentPages,
} from '@/features/public/data/documentation-data';
import { AskDoughyModal } from '@/features/docs/components/AskDoughyModal';

// Icon mapping
const iconMap: Record<string, any> = {
  Home,
  Zap,
  FileText,
  MessageSquare,
  Calculator,
  BarChart2,
  PenTool,
  Settings,
  Database,
};

// Extract ## headings from content for TOC
const extractHeadings = (text: string): string[] => {
  return text.split('\n')
    .filter(line => line.startsWith('## '))
    .map(line => line.substring(3));
};

interface SidebarProps {
  currentSlug: string;
  onNavigate?: () => void;
}

function Sidebar({ currentSlug, onNavigate }: SidebarProps) {
  const colors = useThemeColors();
  const [expandedSections, setExpandedSections] = useState<string[]>(
    documentationData.map((s) => s.section) // All expanded by default
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="py-4 gap-2">
        {documentationData.map((section) => {
          const Icon = iconMap[section.icon] || FileText;
          const isExpanded = expandedSections.includes(section.section);

          return (
            <View key={section.section}>
              <Pressable
                onPress={() => toggleSection(section.section)}
                className="flex-row items-center justify-between px-4 py-2"
              >
                <View className="flex-row items-center gap-2">
                  <Icon size={18} color={colors.foreground} />
                  <Text className="font-medium" style={{ color: colors.foreground }}>{section.section}</Text>
                </View>
                {isExpanded ? (
                  <ChevronDown size={16} color={colors.mutedForeground} />
                ) : (
                  <ChevronRight size={16} color={colors.mutedForeground} />
                )}
              </Pressable>

              {isExpanded && (
                <View className="ml-6 gap-1">
                  {section.pages.map((page) => {
                    const isActive = page.slug === currentSlug;
                    return (
                      <Link key={page.slug} href={`/docs/${page.slug}`} asChild>
                        <Pressable
                          onPress={onNavigate}
                          className="px-4 py-2 rounded-lg"
                          style={isActive ? { backgroundColor: `${colors.primary}1A` } : undefined}
                        >
                          <Text
                            className={`text-sm ${isActive ? 'font-medium' : ''}`}
                            style={{ color: isActive ? colors.primary : colors.mutedForeground }}
                          >
                            {page.title}
                          </Text>
                        </Pressable>
                      </Link>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// Table of Contents for right sidebar
function TableOfContents({ headings }: { headings: string[] }) {
  const colors = useThemeColors();
  return (
    <View className="py-6 px-4">
      <Text className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.mutedForeground }}>
        On This Page
      </Text>
      <View className="gap-2">
        {headings.map((heading, index) => (
          <Pressable key={index} className="py-1">
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              {heading}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function DocumentationScreen() {
  const { colors } = useTheme();
  const themeColors = useThemeColors();
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showAskDoughy, setShowAskDoughy] = useState(false);

  const currentSlug = slug || 'introduction';
  const pageData = getDocPageBySlug(currentSlug);
  const content = getDocContent(currentSlug);
  const headings = extractHeadings(content);
  const { prev, next } = getAdjacentPages(currentSlug);

  // Parse simple markdown-like content
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('# ')) {
        return (
          <Text key={index} className="text-3xl font-bold mb-6" style={{ color: themeColors.foreground }}>
            {line.substring(2)}
          </Text>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <Text key={index} className="text-xl font-semibold mt-8 mb-4" style={{ color: themeColors.foreground }}>
            {line.substring(3)}
          </Text>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <View key={index} className="flex-row items-start gap-2 ml-4 mb-2">
            <Text style={{ color: themeColors.foreground }}>{'•'}</Text>
            <Text className="flex-1" style={{ color: themeColors.mutedForeground }}>{line.substring(2)}</Text>
          </View>
        );
      }
      if (line.match(/^\d+\. /)) {
        return (
          <View key={index} className="flex-row items-start gap-2 ml-4 mb-2">
            <Text style={{ color: themeColors.foreground }}>{line.match(/^\d+/)![0]}.</Text>
            <Text className="flex-1" style={{ color: themeColors.mutedForeground }}>{line.replace(/^\d+\. /, '')}</Text>
          </View>
        );
      }
      if (line.trim() === '') {
        return <View key={index} className="h-4" />;
      }
      return (
        <Text key={index} className="mb-2" style={{ color: themeColors.mutedForeground }}>
          {line}
        </Text>
      );
    });
  };

  return (
    <View className="flex-1" style={{ backgroundColor: themeColors.background }}>
      {/* Mobile Header */}
      {isMobile && (
        <View
          className="flex-row items-center justify-between px-4 py-3"
          style={{ borderBottomWidth: 1, borderBottomColor: themeColors.border, backgroundColor: themeColors.card }}
        >
          <Text className="font-semibold" style={{ color: themeColors.foreground }}>Documentation</Text>
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => setShowAskDoughy(true)}>
              <Search size={22} color={themeColors.primary} />
            </Pressable>
            <Pressable onPress={() => setShowMobileSidebar(!showMobileSidebar)}>
              {showMobileSidebar ? (
                <X size={24} color={themeColors.foreground} />
              ) : (
                <Menu size={24} color={themeColors.foreground} />
              )}
            </Pressable>
          </View>
        </View>
      )}

      <View className="flex-1 flex-row">
        {/* Sidebar */}
        {(!isMobile || showMobileSidebar) && (
          <View
            style={isMobile
              ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: themeColors.background }
              : { width: 256, borderRightWidth: 1, borderRightColor: themeColors.border }
            }
          >
            <Sidebar
              currentSlug={currentSlug}
              onNavigate={() => setShowMobileSidebar(false)}
            />
          </View>
        )}

        {/* Content */}
        {(!isMobile || !showMobileSidebar) && (
          <ScrollView className="flex-1" contentContainerStyle={{ paddingVertical: 24, paddingHorizontal: 40, flexGrow: 1 }}>
            <View className="w-full">
              {pageData && (
                <View className="mb-4">
                  <Text className="text-sm" style={{ color: themeColors.primary }}>{pageData.section}</Text>
                </View>
              )}
              {renderContent(content)}

              {/* Navigation */}
              <View className="flex-row justify-between mt-12 pt-8" style={{ borderTopWidth: 1, borderTopColor: themeColors.border }}>
                {prev ? (
                  <Link href={`/docs/${prev.slug}`} asChild>
                    <Pressable className="py-2 flex-row items-center gap-2">
                      <ChevronLeft size={16} color={themeColors.primary} />
                      <View>
                        <Text className="text-sm" style={{ color: themeColors.mutedForeground }}>Previous</Text>
                        <Text style={{ color: themeColors.primary }}>{prev.title}</Text>
                      </View>
                    </Pressable>
                  </Link>
                ) : (
                  <View />
                )}
                {next ? (
                  <Link href={`/docs/${next.slug}`} asChild>
                    <Pressable className="py-2 flex-row items-center gap-2">
                      <View className="items-end">
                        <Text className="text-sm" style={{ color: themeColors.mutedForeground }}>Next</Text>
                        <Text style={{ color: themeColors.primary }}>{next.title}</Text>
                      </View>
                      <ChevronRight size={16} color={themeColors.primary} />
                    </Pressable>
                  </Link>
                ) : (
                  <Link href="/contact" asChild>
                    <Pressable className="py-2 items-end">
                      <Text className="text-sm" style={{ color: themeColors.mutedForeground }}>Need Help?</Text>
                      <Text style={{ color: themeColors.primary }}>Contact Support</Text>
                    </Pressable>
                  </Link>
                )}
              </View>
            </View>
          </ScrollView>
        )}

        {/* Right TOC - desktop only */}
        {!isMobile && headings.length > 0 && (
          <View className="w-52" style={{ borderLeftWidth: 1, borderLeftColor: themeColors.border }}>
            <TableOfContents headings={headings} />
          </View>
        )}
      </View>

      {/* Ask Doughy Modal */}
      <AskDoughyModal
        visible={showAskDoughy}
        onClose={() => setShowAskDoughy(false)}
      />
    </View>
  );
}
