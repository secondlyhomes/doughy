// src/lib/zillow-calculations.ts
// ARV and valuation calculation utilities

import type { ComparableProperty, PropertyValuation } from './zillow-types';

/**
 * Calculate ARV (After Repair Value) from comparable sales
 *
 * @example
 * ```typescript
 * const arv = calculateARV(comps, subjectProperty);
 * console.log('Estimated ARV:', arv.estimatedValue);
 * ```
 */
export function calculateARV(
  comps: ComparableProperty[],
  subjectSqft: number
): PropertyValuation {
  if (comps.length === 0) {
    return {
      estimatedValue: 0,
      lowEstimate: 0,
      highEstimate: 0,
      confidence: 0,
      lastUpdated: new Date().toISOString(),
      source: 'calculated',
      methodology: 'No comparable sales available',
    };
  }

  // Calculate weighted average price per sqft
  // Weight by similarity score and recency
  let totalWeight = 0;
  let weightedPricePerSqft = 0;
  const pricesPerSqft: number[] = [];

  comps.forEach((comp) => {
    const weight = comp.similarity || 0.5;
    weightedPricePerSqft += comp.pricePerSqft * weight;
    totalWeight += weight;
    pricesPerSqft.push(comp.pricePerSqft);
  });

  const avgPricePerSqft = weightedPricePerSqft / totalWeight;
  const estimatedValue = Math.round(avgPricePerSqft * subjectSqft);

  // Calculate confidence based on comp consistency
  const variance =
    pricesPerSqft.reduce((sum, p) => sum + Math.pow(p - avgPricePerSqft, 2), 0) /
    pricesPerSqft.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / avgPricePerSqft;

  // Higher CV = lower confidence (more variance in comps)
  const confidence = Math.max(0, Math.min(1, 1 - coefficientOfVariation));

  // Calculate range based on variance
  const margin = stdDev * subjectSqft * 1.5;
  const lowEstimate = Math.round(estimatedValue - margin);
  const highEstimate = Math.round(estimatedValue + margin);

  return {
    estimatedValue,
    lowEstimate: Math.max(0, lowEstimate),
    highEstimate,
    confidence: Math.round(confidence * 100) / 100,
    lastUpdated: new Date().toISOString(),
    source: 'calculated',
    methodology: `Weighted average of ${comps.length} comparable sales at $${Math.round(avgPricePerSqft)}/sqft`,
  };
}
