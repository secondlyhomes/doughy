// src/features/public/components/Footer.tsx
// Public website footer (web-only)
import { View, Text, Image, Pressable, Linking } from 'react-native';
import { Link } from 'expo-router';
import { Twitter, Facebook, Instagram, Linkedin } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

export function Footer() {
  const { colors } = useTheme();
  const currentYear = new Date().getFullYear();

  const openExternalLink = (url: string) => {
    Linking.openURL(url);
  };

  const SocialLink = ({ href, Icon, label }: { href: string; Icon: any; label: string }) => (
    <Pressable
      onPress={() => openExternalLink(href)}
      className="p-1"
      accessibilityLabel={label}
      accessibilityRole="link"
    >
      <Icon size={20} color={colors.mutedForeground} />
    </Pressable>
  );

  const FooterLink = ({ href, children, external = false }: { href: string; children: string; external?: boolean }) => {
    if (external) {
      return (
        <Pressable onPress={() => openExternalLink(href)}>
          <Text className="text-muted-foreground hover:text-primary text-sm">{children}</Text>
        </Pressable>
      );
    }
    return (
      <Link href={href as any} asChild>
        <Pressable>
          <Text className="text-muted-foreground hover:text-primary text-sm">{children}</Text>
        </Pressable>
      </Link>
    );
  };

  return (
    <View className="py-12 border-t border-primary bg-background w-full">
      <View className="px-4 sm:px-6 lg:px-8 mx-auto max-w-[1200px]">
        <View className="flex-row flex-wrap gap-8 mb-8">
          {/* Company Info Column */}
          <View className="flex-1 min-w-[200px]">
            <View className="flex-row items-center gap-2 mb-4">
              <Image
                source={require('../../../../assets/images/doughy_logo.png')}
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
              />
              <Text className="text-3xl tracking-tight text-primary font-lobster">
                Doughy
              </Text>
            </View>
            <Text className="text-sm text-muted-foreground mb-4">
              Lead management for real estate investors
            </Text>
            <Text className="text-sm text-muted-foreground">
              {currentYear} <Text className="text-primary font-lobster">Doughy</Text>
            </Text>
            <View className="flex-row gap-4 mt-4">
              <SocialLink href="https://twitter.com/doughy" Icon={Twitter} label="Twitter" />
              <SocialLink href="https://facebook.com/doughy" Icon={Facebook} label="Facebook" />
              <SocialLink href="https://instagram.com/doughy" Icon={Instagram} label="Instagram" />
              <SocialLink href="https://linkedin.com/company/doughy" Icon={Linkedin} label="LinkedIn" />
            </View>
          </View>

          {/* Features & Products Column */}
          <View className="flex-1 min-w-[150px]">
            <Text className="text-lg font-semibold text-foreground mb-4">Features & Products</Text>
            <View className="gap-2">
              <FooterLink href="/features/real-estate">Real Estate Investing</FooterLink>
              <FooterLink href="/features/lead-management">Core Lead Management</FooterLink>
              <FooterLink href="/features/ai-agents">AI Agents</FooterLink>
              <FooterLink href="/features/roi">ROI & Time Savings</FooterLink>
            </View>
          </View>

          {/* Resources Column */}
          <View className="flex-1 min-w-[150px]">
            <Text className="text-lg font-semibold text-foreground mb-4">Resources</Text>
            <View className="gap-2">
              <FooterLink href="/docs">Documentation</FooterLink>
              <FooterLink href="/contact">Support</FooterLink>
              <FooterLink href="https://status.doughy.app" external>System Status</FooterLink>
              <FooterLink href="/pricing">Pricing</FooterLink>
            </View>
          </View>

          {/* Company Column */}
          <View className="flex-1 min-w-[150px]">
            <Text className="text-lg font-semibold text-foreground mb-4">Company</Text>
            <View className="gap-2">
              <FooterLink href="/about">About Us</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
              <FooterLink href="/privacy">Privacy Policy</FooterLink>
              <FooterLink href="/terms">Terms of Service</FooterLink>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
