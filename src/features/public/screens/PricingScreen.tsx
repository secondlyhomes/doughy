// src/features/public/screens/PricingScreen.tsx
// Public pricing page
//
// NOTE: This public marketing page intentionally uses hardcoded brand colors
// for consistent cross-platform branding. Do not migrate to theme colors.
import { useState } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface PricingFeature {
  name: string;
  included: boolean;
  highlight?: boolean;
}

interface PricingTier {
  name: string;
  price: string;
  monthlyPrice?: string;
  description: string;
  credits?: string;
  features: PricingFeature[];
  popular?: boolean;
  hasTrial?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: 'Starter',
    price: '$19',
    monthlyPrice: '$23',
    description: 'Basic plan for individuals getting started',
    credits: 'Limited credit allowance',
    hasTrial: true,
    features: [
      { name: 'Basic API Access', included: true },
      { name: '3 Projects', included: true },
      { name: 'Simple Analytics', included: true },
      { name: 'Email Support', included: true },
      { name: 'Standard Processing', included: true },
      { name: 'Community Forum Access', included: true },
      { name: 'Enhanced Features', included: false },
      { name: 'Priority Support', included: false },
    ],
  },
  {
    name: 'Personal',
    price: '$49',
    monthlyPrice: '$59',
    description: 'Perfect for individuals and small projects',
    credits: 'Standard credit allowance',
    hasTrial: true,
    features: [
      { name: 'Standard API Access', included: true },
      { name: '5 Projects', included: true },
      { name: 'Basic Analytics', included: true },
      { name: 'Email Support', included: true },
      { name: 'Standard Processing', included: true },
      { name: 'Community Access', included: true },
      { name: 'Enhanced Features', included: false },
      { name: 'Priority Support', included: false },
    ],
  },
  {
    name: 'Professional',
    price: '$99',
    monthlyPrice: '$119',
    description: 'Ideal for growing businesses and teams',
    credits: 'Enhanced credit allowance',
    popular: true,
    hasTrial: true,
    features: [
      { name: 'Extended API Access', included: true },
      { name: 'Unlimited Projects', included: true, highlight: true },
      { name: 'Advanced Analytics', included: true, highlight: true },
      { name: 'Priority Email Support', included: true },
      { name: 'Faster Processing', included: true, highlight: true },
      { name: 'Enhanced Features', included: true, highlight: true },
      { name: 'Priority Support', included: true },
      { name: 'Advanced Integrations', included: false },
    ],
  },
  {
    name: 'Enterprise',
    price: 'Contact Us',
    description: 'Custom solutions for large organizations',
    features: [
      { name: 'Unlimited API Access', included: true, highlight: true },
      { name: 'Unlimited Projects', included: true, highlight: true },
      { name: 'Enterprise Analytics', included: true, highlight: true },
      { name: '24/7 Dedicated Support', included: true, highlight: true },
      { name: 'Priority Processing', included: true, highlight: true },
      { name: 'Custom SLAs', included: true, highlight: true },
      { name: 'Custom Integrations', included: true, highlight: true },
      { name: 'Tailored Solutions', included: true, highlight: true },
    ],
  },
];

const faqs = [
  {
    question: 'What are credits and how do they work?',
    answer:
      "Credits are our platform's usage-based currency. Each plan includes a base allocation of credits that refresh monthly. Different actions consume different amounts of credits, allowing you to allocate resources to the features you use most.",
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll immediately gain access to additional features. When downgrading, changes take effect at the start of your next billing cycle.",
  },
  {
    question: 'Do you offer discounts for non-profits?',
    answer:
      'Yes, we offer special pricing for qualified non-profit organizations and educational institutions. Please contact our sales team for more information.',
  },
  {
    question: 'Is there a free trial available?',
    answer:
      "We offer a 30-day money-back guarantee on our Personal and Professional plans. If you're not satisfied within the first 30 days, we'll provide a full refund.",
  },
];

function PricingCard({ tier, isAnnual }: { tier: PricingTier; isAnnual: boolean }) {
  const colors = useThemeColors();
  const { isAuthenticated } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const displayPrice = isAnnual ? tier.price : (tier.monthlyPrice || tier.price);
  const isEnterprise = tier.name === 'Enterprise';

  return (
    <Pressable
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      className="h-full"
      style={{
        transform: [{ scale: isHovered ? 1.02 : 1 }],
        shadowColor: isHovered ? (isEnterprise ? '#f59e0b' : colors.primary) : 'transparent',
        shadowOffset: { width: 0, height: isHovered ? 8 : 0 },
        shadowOpacity: isHovered ? 0.2 : 0,
        shadowRadius: isHovered ? 24 : 0,
        elevation: isHovered ? 8 : 0,
      }}
    >
    <Card
      className={`p-6 h-full relative ${tier.popular ? 'border-2 border-primary' : ''} ${isEnterprise ? 'border-2 border-amber-500' : ''} ${isHovered && !tier.popular && !isEnterprise ? 'border-primary/50' : ''}`}
      style={isEnterprise ? {
        backgroundColor: 'rgba(245, 158, 11, 0.05)',
      } : undefined}
    >
      {tier.popular && (
        <View className="absolute -top-3 right-4 px-3 py-1 rounded-full" style={{ backgroundColor: colors.primary }}>
          <Text className="text-xs font-medium" style={{ color: colors.primaryForeground }}>Most Popular</Text>
        </View>
      )}
      {isEnterprise && (
        <View className="absolute -top-3 right-4 px-3 py-1 rounded-full" style={{ backgroundColor: '#f59e0b' }}>
          <Text className="text-xs font-medium" style={{ color: '#ffffff' }}>Enterprise</Text>
        </View>
      )}

      <Text className="text-xl font-bold mb-2" style={{ color: colors.foreground }}>{tier.name}</Text>

      <View className="flex-row items-baseline mb-2">
        <Text className="text-4xl font-bold" style={{ color: colors.foreground }}>{displayPrice}</Text>
        {!isEnterprise && (
          <Text className="ml-1" style={{ color: colors.mutedForeground }}>/month</Text>
        )}
      </View>

      {!isEnterprise && isAnnual && (
        <Text className="text-sm mb-2" style={{ color: colors.mutedForeground }}>billed annually</Text>
      )}

      <Text className="mb-4" style={{ color: colors.mutedForeground }}>{tier.description}</Text>

      {tier.credits && (
        <Text className="text-sm mb-4" style={{ color: colors.primary }}>{tier.credits}</Text>
      )}

      <Link
        href={isEnterprise ? '/contact' : isAuthenticated ? '/(tabs)' : '/(auth)/sign-up'}
        asChild
      >
        <Button className="w-full mb-6" variant={tier.popular ? 'default' : 'outline'}>
          <Text
            className="font-medium"
            style={{ color: tier.popular ? colors.primaryForeground : colors.foreground }}
          >
            {isEnterprise ? 'Contact Sales' : 'Get Started'}
          </Text>
        </Button>
      </Link>

      <View className="gap-3">
        {tier.features.map((feature, index) => (
          <View key={index} className="flex-row items-center gap-2">
            {feature.included ? (
              <Check size={18} color={feature.highlight ? colors.primary : colors.foreground} />
            ) : (
              <X size={18} color={colors.mutedForeground} />
            )}
            <Text
              className={`flex-1 ${feature.included && feature.highlight ? 'font-medium' : ''}`}
              style={{
                color: feature.included
                  ? feature.highlight
                    ? colors.primary
                    : colors.foreground
                  : colors.mutedForeground
              }}
            >
              {feature.name}
            </Text>
          </View>
        ))}
      </View>
    </Card>
    </Pressable>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={() => setIsOpen(!isOpen)}
      className="py-4 w-full"
      style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
    >
      <View className="flex-row items-start justify-between w-full">
        <Text className="font-medium flex-1 pr-4 flex-shrink" style={{ color: colors.foreground }}>{question}</Text>
        <View className="flex-shrink-0">
          {isOpen ? (
            <ChevronUp size={20} color={colors.foreground} />
          ) : (
            <ChevronDown size={20} color={colors.foreground} />
          )}
        </View>
      </View>
      {isOpen && (
        <Text className="mt-3 w-full" style={{ color: colors.mutedForeground }}>{answer}</Text>
      )}
    </Pressable>
  );
}

export function PricingScreen() {
  const [isAnnual, setIsAnnual] = useState(true);
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View className="flex-1 py-12" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View className="px-4 sm:px-6 lg:px-8 mb-12">
        <View className="max-w-[1400px] mx-auto items-center">
          <Text className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: colors.primary }}>
            Simple, Transparent Pricing
          </Text>
          <Text className="text-lg text-center mb-8 max-w-2xl" style={{ color: colors.mutedForeground }}>
            Choose the plan that fits your needs. All plans include a 30-day money-back guarantee.
          </Text>

          {/* Billing Toggle */}
          <View className="flex-row items-center gap-4 p-1 rounded-lg" style={{ backgroundColor: colors.card }}>
            <Pressable
              onPress={() => setIsAnnual(false)}
              className="px-4 py-2 rounded-md"
              style={!isAnnual ? { backgroundColor: colors.primary } : undefined}
            >
              <Text style={{ color: !isAnnual ? colors.primaryForeground : colors.foreground, fontWeight: !isAnnual ? '500' : undefined }}>
                Monthly
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setIsAnnual(true)}
              className="px-4 py-2 rounded-md"
              style={isAnnual ? { backgroundColor: colors.primary } : undefined}
            >
              <View className="flex-row items-center gap-2">
                <Text style={{ color: isAnnual ? colors.primaryForeground : colors.foreground, fontWeight: isAnnual ? '500' : undefined }}>
                  Annual
                </Text>
                <View className="px-2 py-0.5 rounded" style={{ backgroundColor: '#22c55e' }}>
                  <Text className="text-xs font-medium" style={{ color: '#ffffff' }}>Save 20%</Text>
                </View>
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Pricing Cards */}
      <View className="px-4 sm:px-6 lg:px-8 mb-12">
        <View className="max-w-[1400px] mx-auto">
          <View className={`${isMobile ? 'flex-col' : 'flex-row items-stretch'} gap-6 pt-4`}>
            {tiers.map((tier) => (
              <View key={tier.name} className="flex-1" style={{ minHeight: isMobile ? undefined : 520 }}>
                <PricingCard tier={tier} isAnnual={isAnnual} />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* FAQ Section */}
      <View className="px-4 sm:px-6 lg:px-8 py-16" style={{ backgroundColor: colors.card }}>
        <View style={{ maxWidth: 720, width: '100%', marginHorizontal: 'auto' }}>
          <Text className="text-3xl font-bold text-center mb-12" style={{ color: colors.foreground }}>
            Frequently Asked Questions
          </Text>
          <View className="gap-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
