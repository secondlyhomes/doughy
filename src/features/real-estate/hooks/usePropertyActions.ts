// src/features/real-estate/hooks/usePropertyActions.ts
// Hook for property actions: share, export, status management

import { useState, useCallback } from 'react';
import { Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '@/lib/supabase';
import { Property } from '../types';
import { PropertyStatus } from '../types/constants';
import { formatCurrency, formatSquareFeet, formatPropertyType, formatDate } from '../utils/formatters';

interface UsePropertyActionsReturn {
  shareProperty: (property: Property, type: 'link' | 'text' | 'full') => Promise<boolean>;
  exportPropertySummary: (property: Property) => Promise<string | null>;
  copyPropertyLink: (property: Property) => Promise<boolean>;
  updatePropertyStatus: (propertyId: string, status: PropertyStatus) => Promise<boolean>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Generate a shareable text summary of the property
 */
function generatePropertySummary(property: Property, format: 'short' | 'full' = 'short'): string {
  const address = property.address || property.address_line_1 || 'Property';
  const city = property.city || '';
  const state = property.state || '';
  const location = [city, state].filter(Boolean).join(', ');

  const price = property.purchase_price;
  const priceStr = price ? formatCurrency(price) : 'Price TBD';

  if (format === 'short') {
    const details = [
      property.bedrooms ? `${property.bedrooms} bed` : null,
      property.bathrooms ? `${property.bathrooms} bath` : null,
      property.sqft ? formatSquareFeet(property.sqft) : null,
    ].filter(Boolean).join(' • ');

    return `${address}${location ? ` - ${location}` : ''}\n${priceStr}${details ? ` | ${details}` : ''}`;
  }

  // Full format with more details
  const lines: string[] = [
    `🏠 ${address}`,
    location ? `📍 ${location}` : null,
    `💰 ${priceStr}`,
    '',
    '📋 Property Details:',
    property.property_type ? `• Type: ${formatPropertyType(property.property_type)}` : null,
    property.bedrooms ? `• Bedrooms: ${property.bedrooms}` : null,
    property.bathrooms ? `• Bathrooms: ${property.bathrooms}` : null,
    property.sqft ? `• Size: ${formatSquareFeet(property.sqft)}` : null,
    property.lot_size ? `• Lot: ${property.lot_size.toLocaleString()} sqft` : null,
    property.year_built ? `• Built: ${property.year_built}` : null,
  ].filter((line): line is string => line !== null);

  // Add financial info if available
  const arv = property.arv;
  const repairCost = property.repair_cost || property.total_repair_cost || 0;

  if (arv || repairCost) {
    lines.push('', '💵 Investment Analysis:');
    if (arv) lines.push(`• ARV: ${formatCurrency(arv)}`);
    if (repairCost) lines.push(`• Repair Cost: ${formatCurrency(repairCost)}`);

    if (price && arv && repairCost) {
      const potentialProfit = arv - price - repairCost;
      lines.push(`• Potential Profit: ${formatCurrency(potentialProfit)}`);
    }
  }

  // Add notes if available
  if (property.notes) {
    lines.push('', '📝 Notes:', property.notes);
  }

  lines.push('', '—', 'Shared via Doughy');

  return lines.join('\n');
}

/**
 * Generate a property summary for export (detailed text format)
 */
function generateExportSummary(property: Property): string {
  const address = property.address || property.address_line_1 || 'Property';
  const city = property.city || '';
  const state = property.state || '';
  const zip = property.zip || '';
  const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');

  const lines: string[] = [
    '═══════════════════════════════════════════',
    'PROPERTY SUMMARY REPORT',
    '═══════════════════════════════════════════',
    '',
    'PROPERTY INFORMATION',
    '───────────────────────────────────────────',
    `Address: ${fullAddress}`,
    `Property Type: ${property.property_type ? formatPropertyType(property.property_type) : 'N/A'}`,
    `Status: ${property.status || 'N/A'}`,
    '',
    'PROPERTY DETAILS',
    '───────────────────────────────────────────',
    `Bedrooms: ${property.bedrooms || 'N/A'}`,
    `Bathrooms: ${property.bathrooms || 'N/A'}`,
    `Square Feet: ${property.sqft ? property.sqft.toLocaleString() : 'N/A'}`,
    `Lot Size: ${property.lot_size ? property.lot_size.toLocaleString() + ' sqft' : 'N/A'}`,
    `Year Built: ${property.year_built || 'N/A'}`,
    '',
    'FINANCIAL DETAILS',
    '───────────────────────────────────────────',
    `Asking Price: ${formatCurrency(property.purchase_price)}`,
    `ARV (After Repair Value): ${formatCurrency(property.arv)}`,
    `Repair Cost Estimate: ${formatCurrency(property.repair_cost || property.total_repair_cost)}`,
    `Monthly Rent Estimate: ${formatCurrency(property.monthly_rent || property.estimated_rent)}`,
  ];

  // Calculate key metrics if data available
  const price = property.purchase_price || 0;
  const arv = property.arv || 0;
  const repairCost = property.repair_cost || property.total_repair_cost || 0;

  if (price && arv) {
    lines.push('');
    lines.push('KEY METRICS');
    lines.push('───────────────────────────────────────────');

    if (arv > 0) {
      const potentialProfit = arv - price - repairCost;
      const roi = price > 0 ? ((potentialProfit / (price + repairCost)) * 100) : 0;
      lines.push(`Potential Profit: ${formatCurrency(potentialProfit)}`);
      lines.push(`ROI: ${roi.toFixed(1)}%`);
    }

    // 70% Rule MAO
    if (arv > 0) {
      const mao = arv * 0.7 - repairCost;
      lines.push(`MAO (70% Rule): ${formatCurrency(mao)}`);
    }
  }

  // Notes
  if (property.notes) {
    lines.push('');
    lines.push('NOTES');
    lines.push('───────────────────────────────────────────');
    lines.push(property.notes);
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════');
  lines.push(`Generated: ${formatDate(new Date().toISOString())}`);
  lines.push('Doughy - Real Estate Investment Platform');
  lines.push('═══════════════════════════════════════════');

  return lines.join('\n');
}

export function usePropertyActions(): UsePropertyActionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Share property via native share dialog
   */
  const shareProperty = useCallback(async (
    property: Property,
    type: 'link' | 'text' | 'full' = 'text'
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      let message: string;

      switch (type) {
        case 'link':
          // For now, just share a basic summary since we don't have deep linking yet
          message = `Check out this property: ${property.address || property.address_line_1 || 'Property'}`;
          break;
        case 'full':
          message = generatePropertySummary(property, 'full');
          break;
        case 'text':
        default:
          message = generatePropertySummary(property, 'short');
          break;
      }

      const result = await Share.share({
        message,
        title: property.address || property.address_line_1 || 'Property Details',
      });

      return result.action === Share.sharedAction;
    } catch (err) {
      console.error('Error sharing property:', err);
      setError(err instanceof Error ? err : new Error('Failed to share property'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Export property summary to a text file
   */
  const exportPropertySummary = useCallback(async (property: Property): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const summary = generateExportSummary(property);
      const filename = `property-${property.id.slice(0, 8)}-${Date.now()}.txt`;

      if (Platform.OS === 'web') {
        // On web, create a blob and trigger download
        const blob = new Blob([summary], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        try {
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } finally {
          URL.revokeObjectURL(url);
        }
        return filename;
      } else {
        // On native, save to file system and share
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, summary, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/plain',
            dialogTitle: 'Export Property Summary',
          });
        }

        return fileUri;
      }
    } catch (err) {
      console.error('Error exporting property:', err);
      setError(err instanceof Error ? err : new Error('Failed to export property'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Copy property link/info to clipboard
   */
  const copyPropertyLink = useCallback(async (property: Property): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const summary = generatePropertySummary(property, 'short');
      await Clipboard.setStringAsync(summary);

      return true;
    } catch (err) {
      console.error('Error copying property link:', err);
      setError(err instanceof Error ? err : new Error('Failed to copy to clipboard'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update property status in database
   */
  const updatePropertyStatus = useCallback(async (
    propertyId: string,
    status: PropertyStatus
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('re_properties')
        .update({ status })
        .eq('id', propertyId);

      if (updateError) {
        throw updateError;
      }

      return true;
    } catch (err) {
      console.error('Error updating property status:', err);
      setError(err instanceof Error ? err : new Error('Failed to update status'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    shareProperty,
    exportPropertySummary,
    copyPropertyLink,
    updatePropertyStatus,
    isLoading,
    error,
  };
}
