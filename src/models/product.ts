export type DemandTrend = 'increasing' | 'decreasing' | 'stable';

export interface Product {
  productId: string;
  productName: string;
  currentPrice: number;
  competitorPrice: number;
  forecastedDemand: number;
  currentInventory: number;
  demandTrend: DemandTrend;
}

export interface RuleResult {
  ruleName: string;
  adjustment: number;
  explanation: string;
}

export interface PricingResult {
  productName: string;
  currentPrice: number;
  suggestedPrice: number;
  appliedRules: string[];
  explanation: string;
}
