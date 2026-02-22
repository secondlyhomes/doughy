// src/features/public/screens/LandingScreen.tsx
// Landing page for public website
//
// NOTE: This public marketing page intentionally uses hardcoded brand colors (#ffffff, #eab308, etc.)
// for consistent cross-platform branding. Do not migrate to theme colors.
import { View, Text, Image, Pressable, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { ArrowRight, CheckCircle, Star, Clock, BarChart3, Clock3, Calculator, TrendingUp, DollarSign } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// Features data
const features = [
  {
    title: 'Intelligent Lead Scoring',
    description: 'Automatically prioritize your most promising leads based on engagement and behavior patterns.',
    Icon: BarChart3,
  },
  {
    title: 'Automated Follow-ups',
    description: 'Never miss an opportunity with perfectly timed follow-up sequences tailored for real estate investing.',
    Icon: Clock3,
  },
  {
    title: 'Deal Analysis Integration',
    description: 'Seamlessly connect your lead data with property analytics for faster, more informed investment decisions.',
    Icon: Calculator,
  },
];

// Testimonials data
const testimonials = [
  {
    name: 'Michael Rodriguez',
    role: 'Real Estate Investor, TX',
    quote: "Doughy's lead scoring feature helped me focus on the most promising deals, increasing my conversion rate by 40%.",
  },
  {
    name: 'Lisa Chang',
    role: 'Property Manager, WA',
    quote: 'The automated follow-up sequences have saved me hours every week while improving our tenant communication.',
  },
  {
    name: 'James Wilson',
    role: 'Real Estate Agent, FL',
    quote: "I can't imagine running my business without Doughy now. The unified messaging system keeps all communications organized.",
  },
];

// Stats data
const stats = [
  { value: '85%', label: 'Reduction in time spent on administrative tasks', Icon: Clock },
  { value: '40%', label: 'Average reduction in cost per acquisition', Icon: DollarSign },
  { value: '35%', label: 'Increase in closed deals within first 90 days', Icon: TrendingUp },
];

// How it works steps
const howItWorks = [
  {
    title: 'Capture and Qualify Leads',
    description: "Automatically import leads from multiple sources or add them manually. Doughy's AI engine scores and prioritizes leads based on their potential value and engagement level.",
    items: ['Multiple lead capture channels', 'Automated lead scoring', 'Smart lead assignment'],
    imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Nurture Relationships',
    description: "Set up intelligent follow-up sequences tailored to each lead's interests and behavior. Our unified messaging system keeps all your communications organized in one place.",
    items: ['Automated follow-up sequences', 'Unified incoming and outgoing messaging', 'Email and SMS templates'],
    imageUrl: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Close More Deals',
    description: 'Analyze potential deals with powerful AI tools that highlight opportunities and potential issues. Track your pipeline and forecast future revenue.',
    items: ['AI-powered deal analysis', 'Pipeline management', 'ROI calculator'],
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
];

export function LandingScreen() {
  const colors = useThemeColors();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Hero Section */}
      <View className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <View className="max-w-[1200px] mx-auto">
          <View className="max-w-3xl mx-auto items-center">
            <Text className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-center mb-4" style={{ color: colors.foreground }}>
              Transform Your Real Estate
            </Text>
            <Text className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-center mb-6" style={{ color: colors.primary }}>
              Lead Management
            </Text>
            <Text className="text-lg md:text-xl text-center mb-10 max-w-2xl" style={{ color: colors.mutedForeground }}>
              Unlock growth potential with Doughy{'\''} intelligent platform designed exclusively for real estate investors to capture, nurture, and convert more leads.
            </Text>
            <View className={`${isMobile ? 'flex-col' : 'flex-row'} gap-4 items-center justify-center`}>
              <Link href={isAuthenticated ? '/(tabs)' : '/pricing'} asChild>
                <Button size="lg">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-medium" style={{ color: colors.primaryForeground }}>
                      {isAuthenticated ? 'Dashboard' : 'Get Started'}
                    </Text>
                    <ArrowRight size={16} color={colors.primaryForeground} />
                  </View>
                </Button>
              </Link>
              <Link href="/features/real-estate" asChild>
                <Button variant="outline" size="lg">
                  <Text className="font-medium" style={{ color: colors.foreground }}>Learn More</Text>
                </Button>
              </Link>
            </View>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View className="py-16 md:py-24 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: colors.card }}>
        <View className="max-w-[1200px] mx-auto">
          <View className="items-center mb-16">
            <Text className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: colors.primary }}>
              Why Real Estate Investors Choose Doughy
            </Text>
            <Text className="text-lg text-center max-w-2xl" style={{ color: colors.mutedForeground }}>
              Our specialized platform helps you stay organized, save time, and close more deals
            </Text>
          </View>

          <View className={`${isMobile ? 'flex-col' : 'flex-row'} gap-8`}>
            {features.map((feature, index) => (
              <View key={index} className="flex-1 p-6 rounded-xl shadow-lg" style={{ backgroundColor: colors.background }}>
                <feature.Icon size={48} color={colors.primary} className="mb-4" />
                <Text className="text-xl font-semibold mb-2" style={{ color: colors.foreground }}>{feature.title}</Text>
                <Text style={{ color: colors.mutedForeground }}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* How It Works Section */}
      <View className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <View className="max-w-[1200px] mx-auto">
          <View className="items-center mb-16">
            <Text className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: colors.primary }}>
              How Doughy Works
            </Text>
            <Text className="text-lg text-center max-w-2xl" style={{ color: colors.mutedForeground }}>
              Our platform streamlines your lead management workflow from start to finish
            </Text>
          </View>

          {howItWorks.map((step, index) => (
            <View
              key={index}
              className={`${isMobile ? 'flex-col' : 'flex-row'} gap-8 md:gap-12 items-center mb-16 ${
                !isMobile && index % 2 === 1 ? 'flex-row-reverse' : ''
              }`}
            >
              <View className={`${isMobile ? 'w-full' : 'flex-1'} rounded-xl overflow-hidden shadow-xl`}>
                <Image
                  source={{ uri: step.imageUrl }}
                  className="w-full h-64 md:h-80"
                  resizeMode="cover"
                />
              </View>
              <View className={`${isMobile ? 'w-full' : 'flex-1'}`}>
                <Text className="text-2xl font-semibold mb-4" style={{ color: colors.foreground }}>{step.title}</Text>
                <Text className="mb-6" style={{ color: colors.mutedForeground }}>{step.description}</Text>
                <View className="gap-3">
                  {step.items.map((item, itemIndex) => (
                    <View key={itemIndex} className="flex-row items-start gap-2">
                      <CheckCircle size={20} color={colors.primary} className="mt-0.5" />
                      <Text className="flex-1" style={{ color: colors.foreground }}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Testimonials Section */}
      <View className="py-16 md:py-24 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: colors.card }}>
        <View className="max-w-[1200px] mx-auto">
          <View className="items-center mb-16">
            <Text className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: colors.primary }}>
              Trusted by Real Estate Professionals
            </Text>
            <Text className="text-lg text-center max-w-2xl" style={{ color: colors.mutedForeground }}>
              Join hundreds of successful real estate investors who{'\''}ve transformed their businesses with Doughy
            </Text>
          </View>

          <View className={`${isMobile ? 'flex-col' : 'flex-row'} gap-6`}>
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="flex-1 p-6">
                <View className="flex-row mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} color="#eab308" fill="#eab308" />
                  ))}
                </View>
                <Text className="mb-4 italic" style={{ color: colors.foreground }}>{'"'}{testimonial.quote}{'"'}</Text>
                <View className="flex-row items-center">
                  <View className="h-10 w-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.primary + '33' }}>
                    <Text className="font-semibold" style={{ color: colors.primary }}>{testimonial.name.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text className="font-medium" style={{ color: colors.foreground }}>{testimonial.name}</Text>
                    <Text className="text-sm" style={{ color: colors.mutedForeground }}>{testimonial.role}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </View>
      </View>

      {/* Stats Section */}
      <View className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <View className="max-w-[1200px] mx-auto">
          <View className="items-center mb-16">
            <Text className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: colors.primary }}>
              Boost Your Productivity
            </Text>
            <Text className="text-lg text-center max-w-2xl" style={{ color: colors.mutedForeground }}>
              Our customers see real, measurable results after implementing Doughy
            </Text>
          </View>

          <View className={`${isMobile ? 'flex-col' : 'flex-row'} gap-8`}>
            {stats.map((stat, index) => (
              <View key={index} className="flex-1 items-center">
                <View className="rounded-full p-6 mb-6" style={{ backgroundColor: colors.primary + '33' }}>
                  <stat.Icon size={48} color={colors.primary} />
                </View>
                <Text className="text-4xl md:text-5xl font-bold mb-2" style={{ color: colors.primary }}>{stat.value}</Text>
                <Text className="text-center" style={{ color: colors.mutedForeground }}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Quote Section */}
      <View className="py-16 md:py-24 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: colors.card }}>
        <View className="max-w-[1200px] mx-auto">
          <View className="max-w-3xl mx-auto items-center">
            <Text className="text-6xl mb-4" style={{ color: colors.secondary + '4D' }}>{'"'}</Text>
            <Text className="text-xl md:text-2xl text-center italic mb-8" style={{ color: colors.foreground }}>
              Doughy has completely transformed how I manage my investment leads. I{'\''}ve seen a 30% increase in deal closings since implementing their system.
            </Text>
            <View className="h-px w-24 mb-8" style={{ backgroundColor: colors.primary }} />
            <Text className="font-medium" style={{ color: colors.foreground }}>Sarah Johnson</Text>
            <Text style={{ color: colors.mutedForeground }}>Real Estate Investor, CA</Text>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View className="py-16 md:py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: colors.primary }}>
        <View className="max-w-[1200px] mx-auto">
          <View className="max-w-3xl mx-auto items-center">
            <Text className="text-3xl md:text-4xl font-bold text-center mb-6" style={{ color: '#ffffff' }}>
              Ready to Grow Your Investment Portfolio?
            </Text>
            <Text className="text-lg text-center mb-8" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Join thousands of successful real estate investors using Doughy to manage and convert more leads.
            </Text>
            <Link href={isAuthenticated ? '/(tabs)' : '/pricing'} asChild>
              <Pressable className="px-8 py-4 rounded-lg flex-row items-center gap-2 shadow-lg" style={{ backgroundColor: '#ffffff' }}>
                <Text className="font-semibold text-lg" style={{ color: colors.primary }}>
                  {isAuthenticated ? 'Go to Dashboard' : 'Get Started Today'}
                </Text>
                <ArrowRight size={20} color={colors.primary} />
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}
