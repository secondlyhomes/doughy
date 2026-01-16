// src/features/deals/components/OfferPreview.tsx
// Component for previewing and copying offer scripts/emails

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Copy, Mail, Phone, FileText } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DealStrategy, OfferTerms, Deal, getDealAddress, getDealLeadName } from '../types';
import { offerScriptTemplates, offerEmailTemplates, formatCurrency, formatPercent } from '../data/mockOffers';

interface OfferPreviewProps {
  strategy: DealStrategy;
  terms: OfferTerms;
  deal?: Deal;
  sellerName?: string;
  yourName?: string;
  yourPhone?: string;
}

export function OfferPreview({
  strategy,
  terms,
  deal,
  sellerName = '[Seller Name]',
  yourName = '[Your Name]',
  yourPhone = '[Your Phone]',
}: OfferPreviewProps) {
  const colors = useThemeColors();

  // Generate the call script
  const callScript = useMemo(() => {
    let script = offerScriptTemplates[strategy];

    // Fallback for strategies without templates
    if (!script) {
      return `Hi [SELLER_NAME],

Thank you for discussing ${deal ? getDealAddress(deal) : 'your property'} with me.

I'm interested in purchasing your property for $${terms.purchase_price?.toLocaleString() || '[AMOUNT]'}.

I'll follow up with more details shortly.

Best regards`;
    }

    const address = deal ? getDealAddress(deal) : '[Property Address]';
    const daysToClose = terms.closing_date
      ? Math.ceil((new Date(terms.closing_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 30;

    // Common replacements
    script = script.replace(/\[SELLER_NAME\]/g, sellerName);
    script = script.replace(/\[PROPERTY_ADDRESS\]/g, address);
    script = script.replace(/\[PURCHASE_PRICE\]/g, formatCurrency(terms.purchase_price));
    script = script.replace(/\[EARNEST_MONEY\]/g, formatCurrency(terms.earnest_money));
    script = script.replace(/\[DAYS_TO_CLOSE\]/g, daysToClose.toString());

    // Strategy-specific replacements
    if (strategy === 'seller_finance') {
      script = script.replace(/\[DOWN_PAYMENT\]/g, formatCurrency(terms.down_payment));
      script = script.replace(/\[INTEREST_RATE\]/g, terms.interest_rate?.toString() || '0');
      script = script.replace(/\[MONTHLY_PAYMENT\]/g, formatCurrency(terms.monthly_payment));
      script = script.replace(/\[TERM_YEARS\]/g, terms.term_years?.toString() || '0');
      script = script.replace(/\[BALLOON_PAYMENT\]/g, formatCurrency(terms.balloon_payment));
      script = script.replace(/\[BALLOON_YEARS\]/g, terms.balloon_due_years?.toString() || '0');
    }

    if (strategy === 'subject_to') {
      script = script.replace(/\[CATCH_UP_AMOUNT\]/g, formatCurrency(terms.catch_up_amount));
      script = script.replace(/\[LOAN_BALANCE\]/g, formatCurrency(terms.existing_loan_balance));
      script = script.replace(/\[MONTHLY_PAYMENT\]/g, formatCurrency(terms.existing_monthly_payment));
      script = script.replace(/\[INTEREST_RATE\]/g, terms.existing_interest_rate?.toString() || '0');
    }

    return script;
  }, [strategy, terms, deal, sellerName]);

  // Generate the email
  const emailText = useMemo(() => {
    let email = offerEmailTemplates[strategy];
    const address = deal ? getDealAddress(deal) : '[Property Address]';

    // Fallback for strategies without templates
    if (!email) {
      return `Subject: Offer for ${address}

Dear ${sellerName},

Thank you for considering my offer on your property at ${address}.

Offer Details:
- Purchase Price: ${formatCurrency(terms.purchase_price)}
- Earnest Money: ${formatCurrency(terms.earnest_money)}
- Closing Date: ${terms.closing_date || '[TBD]'}

Please let me know if you have any questions.

Best regards,
${yourName}
${yourPhone}`;
    }

    // Common replacements
    email = email.replace(/\[SELLER_NAME\]/g, sellerName);
    email = email.replace(/\[PROPERTY_ADDRESS\]/g, address);
    email = email.replace(/\[PURCHASE_PRICE\]/g, formatCurrency(terms.purchase_price));
    email = email.replace(/\[EARNEST_MONEY\]/g, formatCurrency(terms.earnest_money));
    email = email.replace(/\[CLOSING_DATE\]/g, terms.closing_date || '[Closing Date]');
    email = email.replace(/\[YOUR_NAME\]/g, yourName);
    email = email.replace(/\[YOUR_PHONE\]/g, yourPhone);

    // Strategy-specific replacements
    if (strategy === 'seller_finance') {
      email = email.replace(/\[DOWN_PAYMENT\]/g, formatCurrency(terms.down_payment));
      email = email.replace(/\[INTEREST_RATE\]/g, terms.interest_rate?.toString() || '0');
      email = email.replace(/\[MONTHLY_PAYMENT\]/g, formatCurrency(terms.monthly_payment));
      email = email.replace(/\[TERM_YEARS\]/g, terms.term_years?.toString() || '0');
    }

    return email;
  }, [strategy, terms, deal, sellerName, yourName, yourPhone]);

  // Copy to clipboard
  const handleCopy = async (text: string, type: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${type} copied to clipboard`);
  };

  return (
    <View>
      {/* Call Script Preview */}
      <Card className="mb-3">
        <CardHeader className="pb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Phone size={18} color={colors.primary} />
              <CardTitle className="text-base">Call Script</CardTitle>
            </View>
            <TouchableOpacity
              onPress={() => handleCopy(callScript, 'Call script')}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-md"
              style={{ backgroundColor: colors.primary }}
              accessibilityLabel="Copy call script"
              accessibilityRole="button"
            >
              <Copy size={14} color={colors.primaryForeground} />
              <Text className="text-xs font-medium" style={{ color: colors.primaryForeground }}>Copy</Text>
            </TouchableOpacity>
          </View>
        </CardHeader>
        <CardContent>
          <ScrollView
            className="max-h-48 rounded-md p-3"
            style={{ backgroundColor: colors.muted }}
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-sm font-mono" style={{ color: colors.foreground }}>{callScript}</Text>
          </ScrollView>
        </CardContent>
      </Card>

      {/* Email Preview */}
      <Card className="mb-3">
        <CardHeader className="pb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Mail size={18} color={colors.primary} />
              <CardTitle className="text-base">Follow-up Email</CardTitle>
            </View>
            <TouchableOpacity
              onPress={() => handleCopy(emailText, 'Email')}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-md"
              style={{ backgroundColor: colors.primary }}
              accessibilityLabel="Copy email"
              accessibilityRole="button"
            >
              <Copy size={14} color={colors.primaryForeground} />
              <Text className="text-xs font-medium" style={{ color: colors.primaryForeground }}>Copy</Text>
            </TouchableOpacity>
          </View>
        </CardHeader>
        <CardContent>
          <ScrollView
            className="max-h-48 rounded-md p-3"
            style={{ backgroundColor: colors.muted }}
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-sm font-mono" style={{ color: colors.foreground }}>{emailText}</Text>
          </ScrollView>
        </CardContent>
      </Card>

      {/* PDF Placeholder */}
      <Card className="mb-3">
        <CardContent className="py-6 items-center">
          <View
            className="w-12 h-12 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: colors.muted }}
          >
            <FileText size={24} color={colors.mutedForeground} />
          </View>
          <Text className="text-sm font-medium mb-1" style={{ color: colors.foreground }}>
            PDF Generation
          </Text>
          <Text className="text-xs text-center" style={{ color: colors.mutedForeground }}>
            Professional PDF offer letters will be available{'\n'}after Supabase integration
          </Text>
        </CardContent>
      </Card>
    </View>
  );
}
