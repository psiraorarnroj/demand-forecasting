import { Product, RuleResult } from '../models/product';

/**
 * Rule 1 — Overstock Discount
 * If inventory is more than 120% of forecasted demand and demand is
 * trending down, suggest a -10% price cut to accelerate sell-through
 * before slow-moving stock has to be written off.
 */
export function applyOverstockRule(product: Product): RuleResult | null {
  const inventoryRatio = product.currentInventory / product.forecastedDemand;
  const isOverstocked = inventoryRatio > 1.2;
  const isDemandFalling = product.demandTrend === 'decreasing';

  if (!isOverstocked || !isDemandFalling) {
    return null;
  }

  return {
    ruleName: 'Rule 1 - Overstock Discount',
    adjustment: -0.1,
    explanation:
      'Inventory is over 120% of forecasted demand and demand is trending down, ' +
      'so price is lowered to accelerate sell-through.',
  };
}
