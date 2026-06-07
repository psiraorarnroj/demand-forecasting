# Demand Forecasting & Dynamic Pricing Engine

A take-home assignment for a Product Manager role: design and reason through a simple, rule-based dynamic pricing engine for a B2B food e-commerce platform (groceries, fresh produce, meat, seafood, and pantry products).

## Problem Statement

The platform sells perishable and semi-perishable goods (produce, meat, seafood, dairy) where prices set "by hand" tend to lag two realities at once: how much demand we actually expect, and how much stock we are sitting on. The result shows up in two opposite ways:

- **Overstock on slowing items** — products get marked down too late (or not at all), tying up cash and risking spoilage write-offs on perishables.
- **Understock on rising items** — products sell out without any price signal to manage demand or capture the willingness to pay that already exists in the market.

Out of the candidate features for this cycle, **Demand Forecasting & Dynamic Pricing** was selected because it sits at the intersection of three things the business cares about right now: it directly moves revenue and margin (not just a cost-side efficiency play), it works with data the platform already collects (price, inventory, demand forecasts), and it can be delivered as a transparent rules engine rather than a black-box model — which matters for a marketplace where buyers and category managers need to trust *why* a price moved. It is also a feature whose value compounds: even a simple version creates the data trail (forecast vs. actual, price vs. sell-through) needed to justify investing in a more advanced, ML-driven version later.

## Business Objective

The platform makes money through **product sales** and **delivery fees**, and is measured on **GMV**, **AOV**, **Gross Profit (GP)**, and **Operating Cost**. Dynamic pricing is a lever on all three of the metrics this assignment asks us to connect to:

- **GMV (Gross Merchandise Value)**
  Lowering prices on overstocked, slowing-demand items increases sell-through volume; raising prices on high-demand, scarce items captures more value per unit. Both actions are aimed at growing total transaction value rather than letting it leak away through stockouts or dead stock sitting unsold.

- **GP (Gross Profit)**
  Matching price to competitor benchmarks (Rule 3) protects against losing orders to competitors on price-sensitive items, while demand-led markups (Rule 2) and guardrails against unnecessary discounting (Rule 4) protect margin on items where the platform already has pricing power. The net effect is fewer "discounts we didn't need to give" and fewer "sales we lost on price."

- **Operating Cost**
  Perishable categories (produce, meat, seafood, dairy) carry real costs for over-purchasing: storage, spoilage, and markdowns-to-zero. Proactively discounting overstocked, slowing items (Rule 1) reduces the volume of stock that has to be written off or cleared at a loss later, which is a direct reduction in waste-driven operating cost — and a healthier inventory position also reduces the working capital tied up in slow-moving stock.

In short: the engine is designed to push price *down* when holding inventory is the bigger risk, and *up* (within limits) when losing inventory to under-pricing is the bigger risk — with guardrails so neither move goes further than the business can safely absorb in a single day.

## Pricing Logic

The engine evaluates five rules per product, in order, and combines their effects into one suggested price. Each rule maps to a specific business situation:

1. **Overstock Discount (Rule 1)** — *"We have more than we need, and demand is falling."*
   If current inventory is more than 120% of forecasted demand **and** the demand trend is decreasing, suggest a **−10%** price cut. This nudges slow-moving stock to sell through faster, before it becomes a write-off.

2. **High-Demand Markup (Rule 2)** — *"We're running low, and people want more."*
   If current inventory is less than 50% of forecasted demand **and** the demand trend is increasing, suggest a **+5%** price increase. This captures some of the extra willingness to pay that shows up when supply is tight, and gently tempers demand so the product doesn't sell out as quickly.

3. **Competitor Price Match (Rule 3)** — *"We're noticeably more expensive than the competition."*
   If the current price is more than 10% above the competitor's price, suggest a **−3%** adjustment. This is a small, defensive correction to avoid losing price-sensitive buyers outright, without fully matching (and potentially starting) a price war.

4. **Critical Stock Guardrail (Rule 4)** — *"We can't afford to discount this — we barely have any left."*
   If inventory is critically low (defined here as under 15% of forecasted demand), **no discount is allowed** — this rule overrides any negative adjustment from Rules 1 or 3 for that product. It exists to stop the engine from doing something obviously counter-productive: discounting an item the business is about to run out of anyway.

5. **Daily Adjustment Cap (Rule 5)** — *"Whatever the rules say, don't move the price too far in one day."*
   The combined adjustment from all applicable rules is capped at **±10%** per day. This is the engine's seatbelt: it keeps price movements predictable for buyers, prevents compounding errors from stacked rules, and gives the business room to review unusual cases before they swing further.

**How the rules combine:** each rule that matches contributes its percentage adjustment; the contributions are summed, Rule 4 zeroes out any remaining negative adjustment if inventory is critical, and Rule 5 clips the final result to the ±10% band. If no rule matches, the price is left unchanged. Every output also lists *which* rules fired and a plain-English reason, so a category manager can see at a glance why a price moved (or didn't).

## Assumptions

- **"Demand trend"** is treated as a simple categorical input — `increasing`, `decreasing`, or `stable` — rather than a numerical rate of change, since the brief specifies trend direction rather than magnitude.
- **"Critically low inventory"** (Rule 4) is defined as inventory below **15% of forecasted demand**. The brief doesn't specify a threshold, so this was chosen as a conservative line below the 50% threshold already used in Rule 2, representing a more severe shortage than "low demand vs. supply."
- **Forecasted demand is treated as a given input**, not computed by this engine — this assignment focuses on the *pricing* logic that consumes a forecast, not on building the forecasting model itself (see Future Improvements).
- **Rules are additive and independent**: when multiple rules match, their percentage adjustments are summed before the cap is applied, rather than only the "strongest" rule winning. This keeps the logic simple and auditable, at the cost of being slightly more aggressive when several conditions overlap (which Rule 5's cap is there to contain).
- **Adjustments apply to the current listed price**, not to cost or margin directly — this mirrors how a category manager would think about "moving the price," and keeps the engine independent of cost data that wasn't part of the provided product schema.
- **One suggested price per product per run** ("daily"), consistent with the "maximum *daily* price adjustment" framing in Rule 5 — the engine is assumed to run on a daily cadence (e.g., an overnight batch job) rather than adjusting prices continuously through the day.
- **Mock data is illustrative**, not derived from real sales — it's designed to exercise every rule (including combinations and edge cases) so the logic and its outputs can be reviewed end-to-end.

## Example Output

Below is a sample run over 10 mock products, covering every rule individually and in combination (including a case where the combined adjustment exceeds the cap, and a case where the critical-stock guardrail blocks a discount):

| Product | Current Price | Suggested Price | Change | Applied Rules |
| --- | --- | --- | --- | --- |
| Jasmine Rice 5kg | ฿245.00 | ฿220.50 | −10% | Rule 1 – Overstock Discount |
| Fresh Chicken Breast 1kg | ฿165.00 | ฿173.25 | +5% | Rule 2 – High Demand Markup |
| Farm Eggs (Tray of 30) | ฿145.00 | ฿145.00 | +0% | No rules triggered |
| Whole Milk 1L | ฿58.00 | ฿56.26 | −3% | Rule 3 – Competitor Price Match |
| Roma Tomatoes 1kg | ฿49.00 | ฿51.45 | +5% | Rule 2 – High Demand Markup |
| Atlantic Salmon Fillet 1kg | ฿520.00 | ฿468.00 | −10% (capped) | Rule 1, Rule 3, Rule 5 – Daily Adjustment Cap |
| Sourdough Bread Loaf | ฿89.00 | ฿89.00 | +0% | No rules triggered |
| Sunflower Cooking Oil 1L | ฿79.00 | ฿79.00 | +0% | No rules triggered |
| Red Onions 1kg | ฿35.00 | ฿36.75 | +5% | Rule 2, Rule 4 – Critical Stock Guardrail |
| Greek Yogurt 500g | ฿99.00 | ฿99.00 | +0% | No rules triggered |

Two rows worth calling out:

- **Atlantic Salmon Fillet 1kg**: Rule 1 (overstock + falling demand, −10%) and Rule 3 (priced 10%+ above competitor, −3%) both fire, summing to −13%. Rule 5 then caps the final move at **−10%**, with the explanation noting that the combined adjustment was reduced to stay within the daily limit.
- **Red Onions 1kg**: Rule 2 would suggest a +5% increase (low stock, rising demand), and Rule 4 confirms inventory is critically low. Since Rule 4 only blocks *discounts*, the +5% increase still applies — the explanation makes clear that the guardrail was checked but didn't need to override anything here.

Each output record includes the product name, current price, suggested price, the list of applied rules, and a plain-English explanation — enough for a category manager to understand and, if needed, override the suggestion.

## Future Improvements

This engine is intentionally a transparent, rules-based starting point. Here's how it could evolve:

- **Machine learning** — Replace fixed rule thresholds (e.g., "120% of forecast," "±10%") with a model that learns optimal price-adjustment sizes from historical outcomes (sell-through rate, margin, stockouts after a price change). The rules engine could remain as a guardrail/explainability layer on top of ML-driven suggestions, so the system stays auditable even as it gets smarter.
- **Seasonality** — Incorporate calendar effects (holidays, paydays, weekly cycles) into the demand forecast itself, so "demand trend" reflects expected seasonal swings rather than just a recent-history direction. This would reduce false positives, e.g., not reading a pre-holiday demand spike as a permanent "increasing" trend that triggers markups that age poorly once the holiday passes.
- **Weather data** — For categories like fresh produce, meat, and seafood, short-term weather (heat waves, storms affecting supply chains, rainy-season demand shifts for certain ingredients) is a real demand driver. Feeding weather forecasts into the demand model would let the engine anticipate demand shifts before they show up in sales data, rather than reacting after the fact.
- **Real-time competitor pricing** — Currently the competitor price is a static input. Connecting to a live price-monitoring feed would let Rule 3 (and similar logic) react to competitor moves within hours rather than waiting for the next data refresh — important in categories where buyers comparison-shop frequently and price gaps close or open quickly.

Together, these would shift the engine from "react to last period's numbers with fixed rules" toward "anticipate near-term demand shifts and respond to the live market" — while keeping the same core idea: clear inputs, explainable outputs, and guardrails that keep automated pricing within bounds the business is comfortable with.

## How to Run Locally

The engine is a small Node.js + TypeScript project with no external runtime dependencies beyond the dev toolchain.

**Prerequisites:** Node.js 18+ and npm.

```bash
# 1. Install dependencies
npm install

# 2. Run the engine directly (no build step needed)
npm start
```

This loads `src/data/products.json`, runs every product through the pricing rules, prints a summary table to the console, and writes the full results — including applied rules and explanations — to `output/suggested-prices.json`.

If you'd rather compile to plain JavaScript first:

```bash
npm run build        # compiles src/ to dist/
node dist/pricing-engine.js
```

## Project Structure

```text
demand-pricing-engine/
├── src/
│   ├── pricing-engine.ts       # Loads data, runs rules, writes output
│   ├── rules/
│   │   ├── overstock.rule.ts       # Rule 1 - Overstock Discount
│   │   ├── high-demand.rule.ts     # Rule 2 - High Demand Markup
│   │   ├── competitor.rule.ts      # Rule 3 - Competitor Price Match
│   │   └── guardrail.rule.ts       # Rule 4 - Critical Stock Guardrail + Rule 5 - Daily Cap
│   ├── models/
│   │   └── product.ts          # Product, RuleResult, PricingResult types
│   └── data/
│       └── products.json       # Mock dataset (10 products)
├── output/
│   └── suggested-prices.json   # Generated sample output (checked in for review)
├── package.json
└── tsconfig.json
```

## Notes on This Submission

This README is the primary deliverable for the product-thinking and business-reasoning portions of the assignment. The pricing logic, rule thresholds, and example output above describe the engine as specified — and the accompanying TypeScript implementation, mock data, generated output, and run instructions above complete the deliverable list from the assignment brief (code, mock dataset, README, sample output, and instructions to run locally).
