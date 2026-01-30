// src/features/public/components/Navbar.tsx
// Public website navigation bar (web-only)
//
// NOTE: Public marketing component - hardcoded brand colors intentional
import { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Pressable, Alert, Platform } from 'react-native';
import { Link, useRouter, usePathname, Href } from 'expo-router';
import { ChevronDown, Menu, X, LogOut, Sun, Moon, Search } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { AskDoughyModal } from '@/features/docs/components/AskDoughyModal';

// Data-driven menu items - add/remove items here
const SOLUTIONS_ITEMS = [
  { href: '/features/real-estate', label: 'Real Estate' },
  { href: '/features/lead-management', label: 'Lead Management' },
  { href: '/features/ai-agents', label: 'AI Agents' },
  { href: '/features/roi', label: 'ROI Calculator' },
] as const;

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSolutionsDropdown, setShowSolutionsDropdown] = useState(false);
  const [showAskDoughy, setShowAskDoughy] = useState(false);
  const { isDark, toggleTheme, colors } = useTheme();
  const { isAuthenticated, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're on a docs page
  const isDocsPage = pathname?.startsWith('/docs');

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('[Navbar] Sign out failed:', error);
      // Inform user that sign out failed so they can try again
      if (Platform.OS !== 'web') {
        Alert.alert('Sign Out Failed', 'Unable to sign out. Please try again.');
      }
    } finally {
      // Always close the menu
      setIsMenuOpen(false);
    }
  };

  const NavLink = ({ href, children, onPress }: { href: string; children: string; onPress?: () => void }) => (
    <Link href={href as Href} asChild>
      <Pressable
        onPress={onPress}
        className="px-3 py-2"
      >
        <Text style={{ color: colors.foreground }}>
          {children}
        </Text>
      </Pressable>
    </Link>
  );

  return (
    <View className="border-b backdrop-blur-xl absolute top-0 left-0 right-0 z-50" style={{ borderColor: colors.border, backgroundColor: colors.background }}>
      <View className="px-4 sm:px-6 lg:px-8 mx-auto max-w-[1200px] flex-row items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" asChild>
          <Pressable className="flex-row items-center gap-2">
            <Image
              source={require('../../../../assets/images/doughy_logo.png')}
              style={{ width: 32, height: 32 }}
              resizeMode="contain"
            />
            <Text className="text-3xl tracking-tight font-lobster" style={{ color: colors.primary }}>
              Doughy
            </Text>
          </Pressable>
        </Link>

        {/* Desktop Navigation */}
        <View className="hidden md:flex flex-row items-center gap-2 flex-1 justify-end">
          {/* Navigation Links Group */}
          <View className="flex-row items-center gap-1 ml-8 mr-6">
            {/* Solutions Dropdown */}
            <View className="relative">
              <Pressable
                onPress={() => setShowSolutionsDropdown(!showSolutionsDropdown)}
                className="flex-row items-center gap-1 px-3 py-2"
              >
                <Text style={{ color: colors.foreground }}>Solutions</Text>
                <ChevronDown size={16} color={colors.foreground} />
              </Pressable>

              {showSolutionsDropdown && (
                <View
                  className="absolute top-full right-0 mt-1 border rounded-lg shadow-lg z-50 w-48"
                  style={{ backgroundColor: colors.card, borderColor: colors.border }}
                  onPointerLeave={() => setShowSolutionsDropdown(false)}
                >
                  <View className="py-1">
                    {SOLUTIONS_ITEMS.map(({ href, label }) => (
                      <Link key={href} href={href as Href} asChild>
                        <Pressable
                          onPress={() => setShowSolutionsDropdown(false)}
                          className="px-4 py-2"
                        >
                          <Text style={{ color: colors.foreground }}>{label}</Text>
                        </Pressable>
                      </Link>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <NavLink href="/pricing">Pricing</NavLink>
            <NavLink href="/docs">Docs</NavLink>
            {isDocsPage && (
              <Pressable
                onPress={() => setShowAskDoughy(true)}
                className="flex-row items-center gap-1 px-3 py-2"
              >
                <Search size={16} color={colors.primary} />
                <Text className="font-medium" style={{ color: colors.primary }}>Ask Doughy</Text>
              </Pressable>
            )}
            <NavLink href="/contact">Contact</NavLink>
          </View>

          {/* Auth Buttons Group */}
          <View className="flex-row items-center gap-3">
            {isAuthenticated ? (
              <Button variant="outline" onPress={handleSignOut}>
                <View className="flex-row items-center gap-1">
                  <LogOut size={16} color={colors.foreground} />
                  <Text className="text-sm font-medium" style={{ color: colors.foreground }}>Sign Out</Text>
                </View>
              </Button>
            ) : (
              <Link href="/(auth)/sign-in" asChild>
                <Button variant="outline">
                  <Text className="text-sm font-medium" style={{ color: colors.foreground }}>Sign In</Text>
                </Button>
              </Link>
            )}

            <Link href={isAuthenticated ? "/(tabs)" : "/pricing"} asChild>
              <Button>
                <Text className="text-sm font-medium" style={{ color: colors.primaryForeground }}>
                  {isAuthenticated ? 'Dashboard' : 'Get Started'}
                </Text>
              </Button>
            </Link>
          </View>

          {/* Theme Toggle */}
          <TouchableOpacity
            onPress={toggleTheme}
            className="p-2 rounded-lg ml-4"
            accessibilityLabel="Toggle theme"
          >
            {isDark ? (
              <Sun size={20} color={colors.foreground} />
            ) : (
              <Moon size={20} color={colors.foreground} />
            )}
          </TouchableOpacity>
        </View>

        {/* Mobile Menu Button */}
        <View className="md:hidden flex-row items-center gap-4">
          <TouchableOpacity
            onPress={toggleTheme}
            className="p-2"
            accessibilityLabel="Toggle theme"
          >
            {isDark ? (
              <Sun size={20} color={colors.foreground} />
            ) : (
              <Moon size={20} color={colors.foreground} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2"
            accessibilityLabel="Toggle menu"
          >
            {isMenuOpen ? (
              <X size={24} color={colors.foreground} />
            ) : (
              <Menu size={24} color={colors.foreground} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <View className="md:hidden border-t" style={{ backgroundColor: colors.background, borderColor: colors.border }}>
          <View className="px-4 pt-2 pb-4 gap-1">
            <Text className="px-3 py-2 font-medium" style={{ color: colors.foreground }}>Solutions</Text>

            {SOLUTIONS_ITEMS.map(({ href, label }) => (
              <Link key={href} href={href as Href} asChild>
                <Pressable onPress={() => setIsMenuOpen(false)} className="px-6 py-2">
                  <Text style={{ color: colors.foreground }}>{label}</Text>
                </Pressable>
              </Link>
            ))}

            <Link href="/pricing" asChild>
              <Pressable onPress={() => setIsMenuOpen(false)} className="px-3 py-2">
                <Text style={{ color: colors.foreground }}>Pricing</Text>
              </Pressable>
            </Link>
            <Link href="/docs" asChild>
              <Pressable onPress={() => setIsMenuOpen(false)} className="px-3 py-2">
                <Text style={{ color: colors.foreground }}>Docs</Text>
              </Pressable>
            </Link>
            <Link href="/contact" asChild>
              <Pressable onPress={() => setIsMenuOpen(false)} className="px-3 py-2">
                <Text style={{ color: colors.foreground }}>Contact</Text>
              </Pressable>
            </Link>

            <View className="px-3 pt-4 gap-2">
              {isAuthenticated ? (
                <Button onPress={handleSignOut} className="w-full">
                  <View className="flex-row items-center gap-2">
                    <LogOut size={16} color={colors.primaryForeground} />
                    <Text className="text-sm font-medium" style={{ color: colors.primaryForeground }}>Sign Out</Text>
                  </View>
                </Button>
              ) : (
                <Link href="/(auth)/sign-in" asChild>
                  <Button className="w-full" onPress={() => setIsMenuOpen(false)}>
                    <Text className="text-sm font-medium" style={{ color: colors.primaryForeground }}>Sign In</Text>
                  </Button>
                </Link>
              )}

              <Link href={isAuthenticated ? "/(tabs)" : "/pricing"} asChild>
                <Button variant="outline" className="w-full" onPress={() => setIsMenuOpen(false)}>
                  <Text className="text-sm font-medium" style={{ color: colors.foreground }}>
                    {isAuthenticated ? 'Dashboard' : 'Get Started'}
                  </Text>
                </Button>
              </Link>
            </View>
          </View>
        </View>
      )}

      {/* Ask Doughy Modal - for docs pages */}
      <AskDoughyModal
        visible={showAskDoughy}
        onClose={() => setShowAskDoughy(false)}
      />
    </View>
  );
}
