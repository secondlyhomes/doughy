// src/features/public/screens/AboutScreen.tsx
// About page for public website
//
// NOTE: This public marketing page intentionally uses hardcoded brand colors
// for consistent cross-platform branding. Do not migrate to theme colors.
import { View, Text, Image, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { Calendar, Users, Brain, ArrowRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const values = [
  {
    Icon: Brain,
    title: 'Innovation First',
    description: 'We embrace AI and cutting-edge technology to solve complex real estate challenges.',
  },
  {
    Icon: Users,
    title: 'User-Centric',
    description: 'Every feature we build starts with understanding the real needs of real estate investors.',
  },
  {
    Icon: Calendar,
    title: 'Continuous Improvement',
    description: 'We constantly iterate and improve based on user feedback and industry trends.',
  },
];

export function AboutScreen() {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Hero Section */}
      <View className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <View className="max-w-[1200px] mx-auto">
          <View className="max-w-3xl mx-auto items-center">
            <Text className="text-4xl md:text-5xl font-bold text-center mb-6" style={{ color: colors.foreground }}>
              About <Text className="font-lobster">Doughy</Text>
            </Text>
            <Text className="text-lg text-center" style={{ color: colors.mutedForeground }}>
              Transforming real estate investing through intelligent lead management
            </Text>
          </View>
        </View>
      </View>

      {/* Mission Section */}
      <View className="py-12 md:py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: colors.card }}>
        <View className="max-w-[1200px] mx-auto">
          <View className={`${isMobile ? 'flex-col' : 'flex-row'} gap-12 items-center`}>
            <View className={`${isMobile ? 'w-full' : 'flex-1'}`}>
              <Text className="text-3xl font-bold mb-6" style={{ color: colors.foreground }}>Our Mission</Text>
              <Text className="mb-4" style={{ color: colors.foreground }}>
                At Doughy, we're on a mission to simplify and enhance the real estate investment process
                through intelligent lead management solutions. We understand the complex pain points that
                real estate investors face daily, from managing leads to analyzing deals.
              </Text>
              <Text style={{ color: colors.foreground }}>
                Our platform combines intuitive user interfaces with powerful AI capabilities to help
                real estate professionals capture, nurture, and convert more leads with less effort.
              </Text>
            </View>
            <View className={`${isMobile ? 'w-full' : 'flex-1'} rounded-xl overflow-hidden shadow-lg`}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                }}
                className="w-full h-64"
                resizeMode="cover"
              />
            </View>
          </View>
        </View>
      </View>

      {/* Story Section */}
      <View className="py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <View className="max-w-[1200px] mx-auto">
          <Text className="text-3xl font-bold text-center mb-8" style={{ color: colors.foreground }}>Our Story</Text>
          <View className="max-w-3xl mx-auto">
            <Text className="mb-4" style={{ color: colors.foreground }}>
              Founded in 2025, Doughy was born out of the frustration its founder experienced while trying
              to manage real estate investment leads using existing tools. We set out to create a solution
              specifically tailored to the needs of real estate investors.
            </Text>
            <Text className="mb-4" style={{ color: colors.foreground }}>
              We understood from the start that addressing the complex challenges of real estate lead
              management would require innovative approaches. That's why we've embraced AI technology
              and modern software development practices.
            </Text>
            <Text style={{ color: colors.foreground }}>
              Today, we're a growing team passionate about leveraging AI agents and cutting-edge
              technologies to improve complex pain points in the real estate industry.
            </Text>
          </View>
        </View>
      </View>

      {/* Values Section */}
      <View className="py-12 md:py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: colors.card }}>
        <View className="max-w-[1200px] mx-auto">
          <Text className="text-3xl font-bold text-center mb-8" style={{ color: colors.foreground }}>Our Values</Text>
          <View className={`${isMobile ? 'flex-col' : 'flex-row'} gap-8`}>
            {values.map((value, index) => (
              <Card key={index} className="flex-1 p-6 items-center">
                <View className="w-12 h-12 rounded-full items-center justify-center mb-4" style={{ backgroundColor: colors.primary + '33' }}>
                  <value.Icon size={24} color={colors.primary} />
                </View>
                <Text className="text-xl font-semibold mb-2 text-center" style={{ color: colors.foreground }}>
                  {value.title}
                </Text>
                <Text className="text-center" style={{ color: colors.mutedForeground }}>{value.description}</Text>
              </Card>
            ))}
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: colors.primary }}>
        <View className="max-w-3xl mx-auto items-center">
          <Text className="text-3xl font-bold text-center mb-4" style={{ color: '#ffffff' }}>
            Ready to Get Started?
          </Text>
          <Text className="text-lg text-center mb-8" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Join thousands of real estate investors using Doughy to manage their leads.
          </Text>
          <Link href="/pricing" asChild>
            <Button style={{ backgroundColor: '#ffffff' }}>
              <View className="flex-row items-center gap-2">
                <Text className="font-medium" style={{ color: colors.primary }}>View Pricing</Text>
                <ArrowRight size={16} color={colors.primary} />
              </View>
            </Button>
          </Link>
        </View>
      </View>
    </View>
  );
}
