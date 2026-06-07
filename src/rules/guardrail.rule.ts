import { Product, RuleResult } from '../models/product';

const CRITICAL_INVENTORY_RATIO = 0.15;
const MAX_DAILY_ADJUSTMENT = 0.1;

/**
 * Rule 4 — Critical Stock Guardrail
 * If inventory is critically low (below 15% of forecasted demand), no
 * discount is allowed — this overrides any negative adjustment from
 * other rules so the engine never discounts stock that's about to run out.
 */
export function applyCriticalStockGuardrail(
  product: Product,
  combinedAdjustment: number
): RuleResult | null {
  const inventoryRatio = product.currentInventory / product.forecastedDemand;
  const isCriticallyLow = inventoryRatio < CRITICAL_INVENTORY_RATIO;

  if (!isCriticallyLow) {
    return null;
  }

  const wouldHaveDiscounted = combinedAdjustment < 0;

  return {
    ruleName: 'Rule 4 - Critical Stock Guardrail',
    adjustment: wouldHaveDiscounted ? -combinedAdjustment : 0,
    explanation: wouldHaveDiscounted
      ? 'Inventory is critically low, so any discount from other rules is blocked to protect stock and margin.'
      : 'Inventory is critically low; no discount would have applied, but this guardrail is noted for transparency.',
  };
}

/**
 * Rule 5 — Daily Adjustment Cap
 * Whatever the combined effect of the other rules, the final price
 * movement is clipped to +/-10% per day to keep price changes
 * predictable and prevent stacked rules from compounding too far.
 */
export function applyDailyAdjustmentCap(combinedAdjustment: number): RuleResult | null {
  const cappedAdjustment = Math.max(
    -MAX_DAILY_ADJUSTMENT,
    Math.min(MAX_DAILY_ADJUSTMENT, combinedAdjustment)
  );

  if (cappedAdjustment === combinedAdjustment) {
    return null;
  }

  return {
    ruleName: 'Rule 5 - Daily Adjustment Cap',
    adjustment: cappedAdjustment - combinedAdjustment,
    explanation:
      `Combined adjustment of ${(combinedAdjustment * 100).toFixed(0)}% exceeds the daily cap, ` +
      `so it is limited to ${(cappedAdjustment * 100).toFixed(0)}%.`,
  };
}
