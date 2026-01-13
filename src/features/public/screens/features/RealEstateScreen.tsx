// src/features/public/screens/features/RealEstateScreen.tsx
// Real Estate feature page
import { View, Text, Image, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { Home, Building2, DollarSign, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const features = [
  {
    Icon: Home,
    title: 'Property Analysis',
    description: 'Comprehensive property analysis with ARV calculations, repair estimates, and ROI projections.',
  },
  {
    Icon: Building2,
    title: 'Portfolio Management',
    description: 'Track all your properties in one place with detailed analytics and performance metrics.',
  },
  {
    Icon: DollarSign,
    title: 'Deal Calculator',
    description: 'Calculate cash-on-cash returns, cap rates, and financing scenarios in seconds.',
  },
  {
    Icon: TrendingUp,
    title: 'Market Insights',
    description: 'Stay informed with market trends, comparable sales, and neighborhood analytics.',
  },
];

const benefits = [
  'Analyze deals 10x faster with AI-powered property analysis',
  'Track unlimited properties across multiple markets',
  'Generate professional investment reports instantly',
  'Integrate with your existing real estate tools',
];

export function RealEstateScreen() {
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
              <Text className="text-sm text-primary font-medium mb-4">REAL ESTATE INVESTING</Text>
              <Text className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Analyze Properties Like a Pro
              </Text>
              <Text className="text-lg text-muted-foreground mb-8">
                Make smarter investment decisions with powerful property analysis tools, deal calculators,
                and portfolio management features designed for real estate investors.
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
                <Link href="/docs/property-analysis" asChild>
                  <Button variant="outline" size="lg">
                    <Text className="text-foreground font-medium">Learn More</Text>
                  </Button>
                </Link>
              </View>
            </View>
            <View className={`${isMobile ? 'w-full' : 'flex-1'} rounded-xl overflow-hidden shadow-lg`}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                }}
                className="w-full h-80"
                resizeMode="cover"
              />
            </View>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-card">
        <View className="max-w-[1200px] mx-auto">
          <View className="items-center mb-12">
            <Text className="text-3xl font-bold text-center text-foreground mb-4">
              Everything You Need to Analyze Real Estate Deals
            </Text>
            <Text className="text-lg text-center text-muted-foreground max-w-2xl">
              Our comprehensive toolset helps you evaluate properties, calculate returns, and manage
              your portfolio with confidence.
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
      <View className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <View className="max-w-[1200px] mx-auto">
          <View className={`${isMobile ? 'flex-col' : 'flex-row'} gap-12 items-center`}>
            <View className={`${isMobile ? 'w-full' : 'flex-1'} rounded-xl overflow-hidden shadow-lg`}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                }}
                className="w-full h-80"
                resizeMode="cover"
              />
            </View>
            <View className={`${isMobile ? 'w-full' : 'flex-1'}`}>
              <Text className="text-3xl font-bold text-foreground mb-6">
                Make Better Investment Decisions
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
            Ready to Analyze Your Next Deal?
          </Text>
          <Text className="text-lg text-center text-white/90 mb-8">
            Join thousands of investors using Doughy to make smarter property decisions.
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
