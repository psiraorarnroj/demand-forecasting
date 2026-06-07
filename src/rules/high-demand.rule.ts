import { Product, RuleResult } from '../models/product';

/**
 * Rule 2 — High Demand Markup
 * If inventory is below 50% of forecasted demand and demand is
 * trending up, suggest a +5% price increase to capture some of the
 * extra willingness to pay and gently temper demand on scarce stock.
 */
export function applyHighDemandRule(product: Product): RuleResult | null {
  const inventoryRatio = product.currentInventory / product.forecastedDemand;
  const isLowStock = inventoryRatio < 0.5;
  const isDemandRising = product.demandTrend === 'increasing';

  if (!isLowStock || !isDemandRising) {
    return null;
  }

  return {
    ruleName: 'Rule 2 - High Demand Markup',
    adjustment: 0.05,
    explanation:
      'Inventory is below 50% of forecasted demand while demand is rising, ' +
      'so price is increased to manage demand and protect margin.',
  };
}
