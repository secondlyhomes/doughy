// src/features/public/screens/features/LeadManagementScreen.tsx
// Lead Management feature page
//
// NOTE: Public marketing page - hardcoded brand colors intentional
import { View, Text, Image, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { Users, Target, Zap, BarChart3, CheckCircle, ArrowRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const features = [
  {
    Icon: Users,
    title: 'Lead Capture',
    description: 'Import leads from multiple sources including CSV, web forms, and integrations.',
  },
  {
    Icon: Target,
    title: 'Smart Scoring',
    description: 'AI-powered lead scoring identifies your most promising opportunities.',
  },
  {
    Icon: Zap,
    title: 'Automation',
    description: 'Automated follow-ups and drip campaigns nurture leads while you sleep.',
  },
  {
    Icon: BarChart3,
    title: 'Analytics',
    description: 'Track conversion rates, response times, and pipeline performance.',
  },
];

const benefits = [
  'Never lose track of a lead with centralized management',
  'Prioritize high-value opportunities with AI scoring',
  'Save 10+ hours per week with automated follow-ups',
  'Close more deals with data-driven insights',
];

export function LeadManagementScreen() {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Hero Section */}
      <View className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <View className="max-w-[1200px] mx-auto">
          <View className={`${isMobile ? 'flex-col' : 'flex-row'} gap-12 items-center`}>
            <View className={`${isMobile ? 'w-full' : 'flex-1'}`}>
              <Text className="text-sm font-medium mb-4" style={{ color: colors.primary }}>LEAD MANAGEMENT</Text>
              <Text className="text-4xl md:text-5xl font-bold mb-6" style={{ color: colors.foreground }}>
                Convert More Leads Into Deals
              </Text>
              <Text className="text-lg mb-8" style={{ color: colors.mutedForeground }}>
                Capture, score, and nurture your leads with intelligent automation. Never miss
                an opportunity with our comprehensive lead management system.
              </Text>
              <View className={`${isMobile ? 'flex-col' : 'flex-row'} gap-4`}>
                <Link href="/pricing" asChild>
                  <Button size="lg">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-medium" style={{ color: colors.primaryForeground }}>Get Started</Text>
                      <ArrowRight size={16} color={colors.primaryForeground} />
                    </View>
                  </Button>
                </Link>
                <Link href="/docs/adding-leads" asChild>
                  <Button variant="outline" size="lg">
                    <Text className="font-medium" style={{ color: colors.foreground }}>Learn More</Text>
                  </Button>
                </Link>
              </View>
            </View>
            <View className={`${isMobile ? 'w-full' : 'flex-1'} rounded-xl overflow-hidden shadow-lg`}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                }}
                className="w-full h-80"
                resizeMode="cover"
              />
            </View>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View className="py-16 md:py-24 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: colors.card }}>
        <View className="max-w-[1200px] mx-auto">
          <View className="items-center mb-12">
            <Text className="text-3xl font-bold text-center mb-4" style={{ color: colors.foreground }}>
              Powerful Lead Management Tools
            </Text>
            <Text className="text-lg text-center max-w-2xl" style={{ color: colors.mutedForeground }}>
              Everything you need to capture, qualify, and convert leads into successful deals.
            </Text>
          </View>

          <View className={`${isMobile ? 'flex-col' : 'flex-row flex-wrap'} gap-6`}>
            {features.map((feature, index) => (
              <View key={index} className={`${isMobile ? 'w-full' : 'flex-1 min-w-[280px]'}`}>
                <Card className="p-6 h-full">
                  <View className="w-12 h-12 rounded-lg items-center justify-center mb-4" style={{ backgroundColor: colors.primary + '1A' }}>
                    <feature.Icon size={24} color={colors.primary} />
                  </View>
                  <Text className="text-xl font-semibold mb-2" style={{ color: colors.foreground }}>{feature.title}</Text>
                  <Text style={{ color: colors.mutedForeground }}>{feature.description}</Text>
                </Card>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Benefits Section */}
      <View className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <View className="max-w-[1200px] mx-auto">
          <View className={`${isMobile ? 'flex-col' : 'flex-row-reverse'} gap-12 items-center`}>
            <View className={`${isMobile ? 'w-full' : 'flex-1'} rounded-xl overflow-hidden shadow-lg`}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1552581234-26160f608093?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                }}
                className="w-full h-80"
                resizeMode="cover"
              />
            </View>
            <View className={`${isMobile ? 'w-full' : 'flex-1'}`}>
              <Text className="text-3xl font-bold mb-6" style={{ color: colors.foreground }}>
                Close More Deals, Faster
              </Text>
              <View className="gap-4">
                {benefits.map((benefit, index) => (
                  <View key={index} className="flex-row items-start gap-3">
                    <CheckCircle size={20} color={colors.primary} className="mt-0.5" />
                    <Text className="flex-1" style={{ color: colors.foreground }}>{benefit}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: colors.primary }}>
        <View className="max-w-3xl mx-auto items-center">
          <Text className="text-3xl font-bold text-center mb-4" style={{ color: colors.primaryForeground }}>
            Ready to Supercharge Your Lead Pipeline?
          </Text>
          <Text className="text-lg text-center mb-8" style={{ color: colors.primaryForeground, opacity: 0.9 }}>
            Start converting more leads into deals today.
          </Text>
          <Link href="/pricing" asChild>
            <Button style={{ backgroundColor: '#ffffff' }}>
              <View className="flex-row items-center gap-2">
                <Text className="font-medium" style={{ color: colors.primary }}>Start Free Trial</Text>
                <ArrowRight size={16} color={colors.primary} />
              </View>
            </Button>
          </Link>
        </View>
      </View>
    </View>
  );
}
