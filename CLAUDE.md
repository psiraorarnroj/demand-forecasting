# CLAUDE.md

Guidance for working in this repository.

## What this is

A small rule-based dynamic pricing engine built as a Product Manager take-home assignment — not a production system. See `README.md` for the full product reasoning (problem statement, business objective, pricing logic, assumptions, example output, future improvements).

## Running it

```bash
npm install
npm start
```

This runs `src/pricing-engine.ts` against `src/data/products.json` and writes `output/suggested-prices.json`.

## Conventions to preserve

- **One rule per file** under `src/rules/`, each a pure function `(product, ...) => RuleResult | null`. Keep them independently readable and testable — don't merge them into the engine.
- **Adjustments are deltas that sum**: every `RuleResult.adjustment` is a percentage delta added to a running total; the guardrail and cap rules also return deltas (the amount needed to correct the total), so the engine can combine everything with a single sum.
- **Every output explains itself**: `appliedRules` and `explanation` must always be populated (including the "no rules triggered" case) so a non-engineer can see why a price did or didn't move.
- **Avoid overengineering**: no databases, frameworks, or config layers — this should stay readable end-to-end in one sitting. If the README's Example Output table and `output/suggested-prices.json` ever drift apart, reconcile them rather than leaving two sources of truth.
