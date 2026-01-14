// src/features/public/screens/AboutScreen.tsx
// About page for public website
import { View, Text, Image, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { Calendar, Users, Brain, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
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
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View className="flex-1 bg-background">
      {/* Hero Section */}
      <View className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <View className="max-w-[1200px] mx-auto">
          <View className="max-w-3xl mx-auto items-center">
            <Text className="text-4xl md:text-5xl font-bold text-center text-foreground mb-6">
              About <Text className="font-lobster">Doughy</Text>
            </Text>
            <Text className="text-lg text-center text-muted-foreground">
              Transforming real estate investing through intelligent lead management
            </Text>
          </View>
        </View>
      </View>

      {/* Mission Section */}
      <View className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-card">
        <View className="max-w-[1200px] mx-auto">
          <View className={`${isMobile ? 'flex-col' : 'flex-row'} gap-12 items-center`}>
            <View className={`${isMobile ? 'w-full' : 'flex-1'}`}>
              <Text className="text-3xl font-bold text-foreground mb-6">Our Mission</Text>
              <Text className="text-foreground mb-4">
                At Doughy, we're on a mission to simplify and enhance the real estate investment process
                through intelligent lead management solutions. We understand the complex pain points that
                real estate investors face daily, from managing leads to analyzing deals.
              </Text>
              <Text className="text-foreground">
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
          <Text className="text-3xl font-bold text-center text-foreground mb-8">Our Story</Text>
          <View className="max-w-3xl mx-auto">
            <Text className="text-foreground mb-4">
              Founded in 2025, Doughy was born out of the frustration its founder experienced while trying
              to manage real estate investment leads using existing tools. We set out to create a solution
              specifically tailored to the needs of real estate investors.
            </Text>
            <Text className="text-foreground mb-4">
              We understood from the start that addressing the complex challenges of real estate lead
              management would require innovative approaches. That's why we've embraced AI technology
              and modern software development practices.
            </Text>
            <Text className="text-foreground">
              Today, we're a growing team passionate about leveraging AI agents and cutting-edge
              technologies to improve complex pain points in the real estate industry.
            </Text>
          </View>
        </View>
      </View>

      {/* Values Section */}
      <View className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-card">
        <View className="max-w-[1200px] mx-auto">
          <Text className="text-3xl font-bold text-center text-foreground mb-8">Our Values</Text>
          <View className={`${isMobile ? 'flex-col' : 'flex-row'} gap-8`}>
            {values.map((value, index) => (
              <Card key={index} className="flex-1 p-6 items-center">
                <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mb-4">
                  <value.Icon size={24} color={colors.primary} />
                </View>
                <Text className="text-xl font-semibold text-foreground mb-2 text-center">
                  {value.title}
                </Text>
                <Text className="text-muted-foreground text-center">{value.description}</Text>
              </Card>
            ))}
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View className="py-16 px-4 sm:px-6 lg:px-8 bg-primary">
        <View className="max-w-3xl mx-auto items-center">
          <Text className="text-3xl font-bold text-center text-white mb-4">
            Ready to Get Started?
          </Text>
          <Text className="text-lg text-center text-white/90 mb-8">
            Join thousands of real estate investors using Doughy to manage their leads.
          </Text>
          <Link href="/pricing" asChild>
            <Button className="bg-white">
              <View className="flex-row items-center gap-2">
                <Text className="text-primary font-medium">View Pricing</Text>
                <ArrowRight size={16} color={colors.primary} />
              </View>
            </Button>
          </Link>
        </View>
      </View>
    </View>
  );
}
