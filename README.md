# Pension Fund Actuarial Balance (איזון אקטוארי)

Quarterly **actuarial balance due to demographic factors** (איזון אקטוארי בגין הגורמים הדמוגרפיים) for Israeli new pension funds, extracted from the Capital Market Authority's [פנסיה נט](https://pensyanet.cma.gov.il/) comparison system.

**📊 Live chart:** https://levz0r.github.io/pension-actuarial-balance/

## What this is

The actuarial balance is a fund-level figure reflecting the demographic surplus/deficit of a pension fund's risk pool for a given reporting period, expressed as a percentage. This dataset tracks it across **all pension fund entities** over the last five years.

- **Coverage:** 22 fund entities (comprehensive *מקיפה* and general *כללית* funds of every company), June 2021 – March 2026
- **Granularity:** **Quarterly** — the metric is only reported in March / June / September / December. There is no monthly data.
- **Source field:** `ODEF_GIRAON_ACTUARI_LETKUFA` (actuarial surplus/deficit for the period)

> The actuarial balance is a *fund-level* demographic figure and is therefore identical across the different investment tracks (מסלולים) of the same fund. One series per fund entity captures it fully.

## Files

| File | Description |
|------|-------------|
| [`pension_actuarial_balance.csv`](pension_actuarial_balance.csv) | Raw data — 22 funds × 20 quarters, wide format (one row per quarter, one column per fund, values in %). Empty cells = fund not reporting that quarter. |
| [`index.html`](index.html) | Self-contained interactive chart (Chart.js). Filter by view (all / comprehensive / general / veteran 6) or multi-select by company. |

## Notes on the data

- The fund set grows over time as newer funds launched (מור, אינפיניטי, אלטשולר שחם) and legacy brands exited (מיטב דש, פסגות — data through 2021/2022 only, before their mergers). Funds that did not exist in a given quarter have empty cells.
- A synchronized dip is visible across all funds in **December 2023**.
- Values are reported by the funds to the regulator and are subject to the methodologies and assumptions described on פנסיה נט.

## Source & attribution

Data: פנסיה נט — מערכת להשוואת קרנות פנסיה, רשות שוק ההון, ביטוח וחיסכון (Capital Market, Insurance and Savings Authority). This repository is an independent compilation for analysis and is not affiliated with the Authority.
