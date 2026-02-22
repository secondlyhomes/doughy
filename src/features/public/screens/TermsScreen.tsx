// src/features/public/screens/TermsScreen.tsx
// Terms of service screen — links to full terms on secondlyhomes.com
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';

const TERMS_URL = 'https://secondlyhomes.com/terms-of-service';

export function TermsScreen() {
  const colors = useThemeColors();

  return (
    <View className="flex-1 py-12" style={{ backgroundColor: colors.background }}>
      <View className="px-4 sm:px-6 lg:px-8">
        <View className="max-w-3xl mx-auto">
          <Text className="text-4xl font-bold text-center mb-4" style={{ color: colors.foreground }}>
            Terms of Service
          </Text>
          <Text className="text-center mb-8" style={{ color: colors.mutedForeground }}>
            Secondly Homes LLC
          </Text>

          <Text className="mb-6 text-base leading-6" style={{ color: colors.foreground }}>
            Our Terms of Service govern your use of all Secondly services including this app
            (Doughy), CallPilot, The Claw AI system, and our website.
          </Text>

          <Text className="mb-6 text-base leading-6" style={{ color: colors.foreground }}>
            Key points:
          </Text>

          <View className="mb-6">
            {[
              'You must be 18+ to use our services',
              'You retain ownership of all content you submit',
              'AI features provide suggestions, not professional advice — review before acting',
              'SMS: Reply STOP to cancel, HELP for help. Msg & data rates may apply',
              'SMS consent is not a condition of purchase or use',
              'You are responsible for call recording consent laws in your jurisdiction',
              'Governed by Commonwealth of Virginia law',
            ].map((point, index) => (
              <View key={index} className="flex-row mb-3">
                <Text style={{ color: colors.mutedForeground }}>{'\u2022  '}</Text>
                <Text className="flex-1 text-base" style={{ color: colors.mutedForeground }}>{point}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            className="flex-row items-center justify-center rounded-lg py-4 px-6 mb-6"
            style={{ backgroundColor: colors.primary }}
            onPress={() => Linking.openURL(TERMS_URL)}
          >
            <Text className="font-semibold text-base mr-2" style={{ color: colors.primaryForeground }}>
              Read Full Terms of Service
            </Text>
            <ExternalLink size={18} color={colors.primaryForeground} />
          </TouchableOpacity>

          <Text className="text-center text-sm" style={{ color: colors.mutedForeground }}>
            Questions? Contact us at contact@secondlyhomes.com
          </Text>
        </View>
      </View>
    </View>
  );
}
