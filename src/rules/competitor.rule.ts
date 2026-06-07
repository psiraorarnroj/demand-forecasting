import { Product, RuleResult } from '../models/product';

const COMPETITOR_PREMIUM_THRESHOLD = 1.1;

/**
 * Rule 3 — Competitor Price Match
 * If the current price is more than 10% above the competitor's price,
 * suggest a -3% adjustment — a small defensive correction to avoid
 * losing price-sensitive buyers without starting a price war.
 */
export function applyCompetitorRule(product: Product): RuleResult | null {
  const isPricedTooHigh =
    product.currentPrice > product.competitorPrice * COMPETITOR_PREMIUM_THRESHOLD;

  if (!isPricedTooHigh) {
    return null;
  }

  return {
    ruleName: 'Rule 3 - Competitor Price Match',
    adjustment: -0.03,
    explanation:
      'Current price is more than 10% above the competitor price, ' +
      'so a small reduction keeps the offer competitive.',
  };
}
