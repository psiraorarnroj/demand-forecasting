import * as fs from 'fs';
import * as path from 'path';
import { PricingResult, Product, RuleResult } from './models/product';
import { applyOverstockRule } from './rules/overstock.rule';
import { applyHighDemandRule } from './rules/high-demand.rule';
import { applyCompetitorRule } from './rules/competitor.rule';
import { applyCriticalStockGuardrail, applyDailyAdjustmentCap } from './rules/guardrail.rule';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Runs a single product through every pricing rule and combines the
 * results into one suggested price with a full audit trail of which
 * rules fired and why.
 */
export function priceProduct(product: Product): PricingResult {
  const results: RuleResult[] = [];

  for (const rule of [applyOverstockRule, applyHighDemandRule, applyCompetitorRule]) {
    const result = rule(product);
    if (result) {
      results.push(result);
    }
  }

  const combinedAdjustment = results.reduce((sum, r) => sum + r.adjustment, 0);

  const guardrailResult = applyCriticalStockGuardrail(product, combinedAdjustment);
  if (guardrailResult) {
    results.push(guardrailResult);
  }
  const adjustmentAfterGuardrail = combinedAdjustment + (guardrailResult?.adjustment ?? 0);

  const capResult = applyDailyAdjustmentCap(adjustmentAfterGuardrail);
  if (capResult) {
    results.push(capResult);
  }
  const finalAdjustment = adjustmentAfterGuardrail + (capResult?.adjustment ?? 0);

  if (results.length === 0) {
    results.push({
      ruleName: 'No rules triggered',
      adjustment: 0,
      explanation: 'No pricing conditions were met, so the current price is kept unchanged.',
    });
  }

  return {
    productName: product.productName,
    currentPrice: product.currentPrice,
    suggestedPrice: round2(product.currentPrice * (1 + finalAdjustment)),
    appliedRules: results.map((r) => r.ruleName),
    explanation: results.map((r) => r.explanation).join(' '),
  };
}

function loadProducts(): Product[] {
  const dataPath = path.join(__dirname, 'data', 'products.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(raw) as Product[];
}

function writeOutput(results: PricingResult[]): void {
  const outputDir = path.join(__dirname, '..', 'output');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'suggested-prices.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Wrote ${results.length} suggested prices to ${outputPath}`);
}

function main(): void {
  const products = loadProducts();
  const results = products.map(priceProduct);
  console.table(
    results.map((r) => ({
      Product: r.productName,
      'Current Price': r.currentPrice,
      'Suggested Price': r.suggestedPrice,
      'Applied Rules': r.appliedRules.join(', '),
    }))
  );
  writeOutput(results);
}

if (require.main === module) {
  main();
}
