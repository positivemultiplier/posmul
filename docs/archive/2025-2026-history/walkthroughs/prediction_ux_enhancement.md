# Prediction Detail Page Enhancement - Hybrid Layout Implementation

## Overview
We have successfully transitioned the Prediction Detail Page to the **Hybrid Layout (Option C)**. This design mimics professional trading platforms by keeping the **Chart** and **Betting Interface** always visible in the main view, while moving secondary information (Rules, Distribution, Forum) to a tabbed section below.

## Key Changes

### 1. Layout Structure
- **Old**: Top-level Tabs (Prediction | Chart | Info) hid the chart when betting.
- **New**:
    - **Top Main Area**:
        - **Left**: Real-time Probability Chart (Always visible).
        - **Right**: Sticky Betting Widget (Always visible).
    - **Bottom Area**: Tabs for deep analysis and auxiliary info.

### 2. Component Refactoring
- **`PredictionDetailView.tsx`**:
    - Stripped of headers, stats grid, and sidebars.
    - Converted into a pure **Betting Widget** (Option Selector + Stake Input + Return Estimator).
- **`SoccerPredictionDetailClient.tsx`**:
    - Implemented the full Hybrid Layout.
    - Integrated `ProbabilityLineChart` directly into the main view.
    - Added "Main Tabs" below for: `Analysis` (Distribution/Timeline), `Info` (Rules), `My Bets`.
- **`PredictionDetailTabsClient.tsx`**:
    - Updated the generic page to match the new Hybrid Layout for consistency across the platform.

### 3. Visual Improvements
- **Charts**:
    - Optimized `ProbabilityLineChart` for the main view.
    - Added `isDarkMode` support to `ParticipantTimelineChart`.
    - `BettingDistributionChart` moved to the "Analysis" tab.
- **Micro-interactions**:
    - Sticky positioning for the betting widget on desktop.
    - Smooth transitions between tabs.

## Verification
- **Functionality**:
    - Betting interface works side-by-side with the chart.
    - Tab switching in the bottom section works independently.
    - Mobile view correctly stacks components (Header -> MoneyWave -> Chart -> Tabs -> Sticky Betting Panel at bottom/inline). *Note: Current implementation puts betting panel at the end of the grid order on mobile, which is standard behavior.*

## Files Modified
- `src/bounded-contexts/prediction/presentation/components/PredictionDetailView.tsx`
- `src/app/prediction/sports/soccer/[slug]/client.tsx`
- `src/app/prediction/components/PredictionDetailTabsClient.tsx`
- `src/bounded-contexts/prediction/presentation/components/charts/ParticipantTimelineChart.tsx`

## Next Steps
- Implement actual data fetching for the charts (currently using mock data logic).
- Connect the Forum/Comments system to the new "Discussion" tab (if added).
