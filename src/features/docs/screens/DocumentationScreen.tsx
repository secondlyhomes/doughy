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
import { useTheme } from '@/context/ThemeContext';
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
  const { colors } = useTheme();
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
                  <Text className="font-medium text-foreground">{section.section}</Text>
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
                          className={`px-4 py-2 rounded-lg ${isActive ? 'bg-primary/10' : ''}`}
                        >
                          <Text
                            className={`text-sm ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}
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
  return (
    <View className="py-6 px-4">
      <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        On This Page
      </Text>
      <View className="gap-2">
        {headings.map((heading, index) => (
          <Pressable key={index} className="py-1">
            <Text className="text-sm text-muted-foreground">
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
          <Text key={index} className="text-3xl font-bold text-foreground mb-6">
            {line.substring(2)}
          </Text>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <Text key={index} className="text-xl font-semibold text-foreground mt-8 mb-4">
            {line.substring(3)}
          </Text>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <View key={index} className="flex-row items-start gap-2 ml-4 mb-2">
            <Text className="text-foreground">{'•'}</Text>
            <Text className="text-muted-foreground flex-1">{line.substring(2)}</Text>
          </View>
        );
      }
      if (line.match(/^\d+\. /)) {
        return (
          <View key={index} className="flex-row items-start gap-2 ml-4 mb-2">
            <Text className="text-foreground">{line.match(/^\d+/)![0]}.</Text>
            <Text className="text-muted-foreground flex-1">{line.replace(/^\d+\. /, '')}</Text>
          </View>
        );
      }
      if (line.trim() === '') {
        return <View key={index} className="h-4" />;
      }
      return (
        <Text key={index} className="text-muted-foreground mb-2">
          {line}
        </Text>
      );
    });
  };

  return (
    <View className="flex-1 bg-background">
      {/* Mobile Header */}
      {isMobile && (
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border bg-card">
          <Text className="font-semibold text-foreground">Documentation</Text>
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => setShowAskDoughy(true)}>
              <Search size={22} color={colors.primary} />
            </Pressable>
            <Pressable onPress={() => setShowMobileSidebar(!showMobileSidebar)}>
              {showMobileSidebar ? (
                <X size={24} color={colors.foreground} />
              ) : (
                <Menu size={24} color={colors.foreground} />
              )}
            </Pressable>
          </View>
        </View>
      )}

      <View className="flex-1 flex-row">
        {/* Sidebar */}
        {(!isMobile || showMobileSidebar) && (
          <View
            className={`${
              isMobile ? 'absolute top-0 left-0 right-0 bottom-0 z-50 bg-background' : 'w-64 border-r border-border'
            }`}
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
                  <Text className="text-sm text-primary">{pageData.section}</Text>
                </View>
              )}
              {renderContent(content)}

              {/* Navigation */}
              <View className="flex-row justify-between mt-12 pt-8 border-t border-border">
                {prev ? (
                  <Link href={`/docs/${prev.slug}`} asChild>
                    <Pressable className="py-2 flex-row items-center gap-2">
                      <ChevronLeft size={16} color={colors.primary} />
                      <View>
                        <Text className="text-sm text-muted-foreground">Previous</Text>
                        <Text className="text-primary">{prev.title}</Text>
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
                        <Text className="text-sm text-muted-foreground">Next</Text>
                        <Text className="text-primary">{next.title}</Text>
                      </View>
                      <ChevronRight size={16} color={colors.primary} />
                    </Pressable>
                  </Link>
                ) : (
                  <Link href="/contact" asChild>
                    <Pressable className="py-2 items-end">
                      <Text className="text-sm text-muted-foreground">Need Help?</Text>
                      <Text className="text-primary">Contact Support</Text>
                    </Pressable>
                  </Link>
                )}
              </View>
            </View>
          </ScrollView>
        )}

        {/* Right TOC - desktop only */}
        {!isMobile && headings.length > 0 && (
          <View className="w-52 border-l border-border">
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
