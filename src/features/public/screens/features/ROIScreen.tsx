// src/features/public/screens/features/ROIScreen.tsx
// ROI Calculator feature page
import { View, Text, Image, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { Calculator, TrendingUp, Clock, PiggyBank, CheckCircle, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const features = [
  {
    Icon: Calculator,
    title: 'Deal Calculator',
    description: 'Calculate ROI, cash-on-cash returns, and cap rates for any property.',
  },
  {
    Icon: TrendingUp,
    title: 'Scenario Modeling',
    description: 'Compare different financing options and exit strategies.',
  },
  {
    Icon: Clock,
    title: 'Time Savings',
    description: 'Analyze deals in minutes instead of hours with smart automation.',
  },
  {
    Icon: PiggyBank,
    title: 'Profit Projections',
    description: 'Get accurate profit estimates with repair costs and holding costs.',
  },
];

const stats = [
  { value: '85%', label: 'Reduction in analysis time' },
  { value: '40%', label: 'Lower cost per acquisition' },
  { value: '35%', label: 'More deals closed' },
];

const benefits = [
  'Calculate ROI for fix & flip, BRRRR, and rental properties',
  'Model multiple financing scenarios side-by-side',
  'Include all costs: repairs, holding, closing, and more',
  'Generate professional reports for lenders and partners',
];

export function ROIScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View className="flex-1 bg-background">
      {/* Hero Section */}
      <View className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <View className="max-w-[1200px] mx-auto">
          <View className={`${isMobile ? 'flex-col' : 'flex-row'} gap-12 items-center`}>
            <View className={`${isMobile ? 'w-full' : 'flex-1'}`}>
              <Text className="text-sm text-primary font-medium mb-4">ROI & TIME SAVINGS</Text>
              <Text className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Know Your Numbers, Close More Deals
              </Text>
              <Text className="text-lg text-muted-foreground mb-8">
                Make confident investment decisions with accurate ROI calculations, profit
                projections, and financing scenario modeling.
              </Text>
              <View className={`${isMobile ? 'flex-col' : 'flex-row'} gap-4`}>
                <Link href="/pricing" asChild>
                  <Button size="lg">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-primary-foreground font-medium">Get Started</Text>
                      <ArrowRight size={16} color={colors.primaryForeground} />
                    </View>
                  </Button>
                </Link>
                <Link href="/docs/deal-calculator" asChild>
                  <Button variant="outline" size="lg">
                    <Text className="text-foreground font-medium">Learn More</Text>
                  </Button>
                </Link>
              </View>
            </View>
            <View className={`${isMobile ? 'w-full' : 'flex-1'} rounded-xl overflow-hidden shadow-lg`}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                }}
                className="w-full h-80"
                resizeMode="cover"
              />
            </View>
          </View>
        </View>
      </View>

      {/* Stats Section */}
      <View className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-card">
        <View className="max-w-[1200px] mx-auto">
          <View className={`${isMobile ? 'flex-col' : 'flex-row'} gap-8 justify-center`}>
            {stats.map((stat, index) => (
              <View key={index} className="items-center">
                <Text className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</Text>
                <Text className="text-muted-foreground text-center">{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <View className="max-w-[1200px] mx-auto">
          <View className="items-center mb-12">
            <Text className="text-3xl font-bold text-center text-foreground mb-4">
              Powerful ROI Tools
            </Text>
            <Text className="text-lg text-center text-muted-foreground max-w-2xl">
              Everything you need to analyze deals and make profitable investment decisions.
            </Text>
          </View>

          <View className={`${isMobile ? 'flex-col' : 'flex-row flex-wrap'} gap-6`}>
            {features.map((feature, index) => (
              <View key={index} className={`${isMobile ? 'w-full' : 'flex-1 min-w-[280px]'}`}>
                <Card className="p-6 h-full">
                  <View className="w-12 h-12 rounded-lg bg-primary/10 items-center justify-center mb-4">
                    <feature.Icon size={24} color={colors.primary} />
                  </View>
                  <Text className="text-xl font-semibold text-foreground mb-2">{feature.title}</Text>
                  <Text className="text-muted-foreground">{feature.description}</Text>
                </Card>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Benefits Section */}
      <View className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-card">
        <View className="max-w-[1200px] mx-auto">
          <View className={`${isMobile ? 'flex-col' : 'flex-row-reverse'} gap-12 items-center`}>
            <View className={`${isMobile ? 'w-full' : 'flex-1'} rounded-xl overflow-hidden shadow-lg`}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                }}
                className="w-full h-80"
                resizeMode="cover"
              />
            </View>
            <View className={`${isMobile ? 'w-full' : 'flex-1'}`}>
              <Text className="text-3xl font-bold text-foreground mb-6">
                Never Overpay for a Property Again
              </Text>
              <View className="gap-4">
                {benefits.map((benefit, index) => (
                  <View key={index} className="flex-row items-start gap-3">
                    <CheckCircle size={20} color={colors.primary} className="mt-0.5" />
                    <Text className="text-foreground flex-1">{benefit}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View className="py-16 px-4 sm:px-6 lg:px-8 bg-primary">
        <View className="max-w-3xl mx-auto items-center">
          <Text className="text-3xl font-bold text-center text-white mb-4">
            Ready to Make Smarter Investments?
          </Text>
          <Text className="text-lg text-center text-white/90 mb-8">
            Start analyzing deals with confidence today.
          </Text>
          <Link href="/pricing" asChild>
            <Button className="bg-white">
              <View className="flex-row items-center gap-2">
                <Text className="text-primary font-medium">Start Free Trial</Text>
                <ArrowRight size={16} color={colors.primary} />
              </View>
            </Button>
          </Link>
        </View>
      </View>
    </View>
  );
}
