// src/features/public/components/Footer.tsx
// Public website footer (web-only)
//
// NOTE: Public marketing component - hardcoded brand colors intentional
import { View, Text, Image, Pressable, Linking, Alert, Platform } from 'react-native';
import { Link } from 'expo-router';
import { Twitter, Facebook, Instagram, Linkedin } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

export function Footer() {
  const { colors } = useTheme();
  const currentYear = new Date().getFullYear();

  const openExternalLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.warn('[Footer] Cannot open URL:', url);
        // Only show alert on native platforms (not web)
        if (Platform.OS !== 'web') {
          Alert.alert('Unable to Open', 'Cannot open this link on your device.');
        }
      }
    } catch (error) {
      console.error('[Footer] Error opening external link:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Unable to Open', 'Something went wrong opening this link.');
      }
    }
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
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>{children}</Text>
        </Pressable>
      );
    }
    return (
      <Link href={href as any} asChild>
        <Pressable>
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>{children}</Text>
        </Pressable>
      </Link>
    );
  };

  return (
    <View className="py-12 border-t w-full" style={{ borderColor: colors.primary, backgroundColor: colors.background }}>
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
              <Text className="text-3xl tracking-tight font-lobster" style={{ color: colors.primary }}>
                Doughy
              </Text>
            </View>
            <Text className="text-sm mb-4" style={{ color: colors.mutedForeground }}>
              Lead management for real estate investors
            </Text>
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              {currentYear} <Text className="font-lobster" style={{ color: colors.primary }}>Doughy</Text>
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
            <Text className="text-lg font-semibold mb-4" style={{ color: colors.foreground }}>Features & Products</Text>
            <View className="gap-2">
              <FooterLink href="/features/real-estate">Real Estate Investing</FooterLink>
              <FooterLink href="/features/lead-management">Core Lead Management</FooterLink>
              <FooterLink href="/features/ai-agents">AI Agents</FooterLink>
              <FooterLink href="/features/roi">ROI & Time Savings</FooterLink>
            </View>
          </View>

          {/* Resources Column */}
          <View className="flex-1 min-w-[150px]">
            <Text className="text-lg font-semibold mb-4" style={{ color: colors.foreground }}>Resources</Text>
            <View className="gap-2">
              <FooterLink href="/docs">Documentation</FooterLink>
              <FooterLink href="/contact">Support</FooterLink>
              <FooterLink href="https://status.doughy.app" external>System Status</FooterLink>
              <FooterLink href="/pricing">Pricing</FooterLink>
            </View>
          </View>

          {/* Company Column */}
          <View className="flex-1 min-w-[150px]">
            <Text className="text-lg font-semibold mb-4" style={{ color: colors.foreground }}>Company</Text>
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
