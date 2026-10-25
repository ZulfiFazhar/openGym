# Specification: Calories Tracker Integration into Plan and Stats

## 1. Overview & Objective
Integrate the Calorie Calculator & AI Nutrition Tracker seamlessly into the **Plan** and **Stats** pages of OpenGym:
- **Plan Page (`/plan`)**: Allow users to inspect, configure, and adjust their daily caloric targets and macronutrient split alongside their workout routines, connected with training vs rest day requirements.
- **Stats Page (`/stats`)**: Provide a dedicated Nutrition analytics tab featuring daily calorie intake vs target trends (`LineChart`), macronutrient consumption averages, target adherence rate, correlation with bodyweight trends, and recent food log history.

---

## 2. Architecture & Data Flow
- **Data Source**: Stored in the unified local/synced Zustand state `useStore.js`:
  - `S.nutritionTarget`: `{ calories, protein, carbs, fat, strategy, bmr, tdee, reasoning }`
  - `S.nutritionLogs`: Array of food items `[{ id, d, name, calories, protein, carbs, fat, meal, source }]`
  - `S.bodyweight`: Array of weigh-ins `[{ d, w, t }]`
  - `S.workouts`: History of completed workouts for correlating training days with nutritional intake.
- **Modals / Sheets**:
  - Re-triggers `NutritionWizardModal` when adjusting targets.
  - Re-triggers `FoodLoggerSheet` when logging meals directly.

---

## 3. Plan Page: "Nutrition" View (`Plan.jsx`)

### 3.1 Segmented Control
Update `Plan.jsx` view selector:
```jsx
<Segmented
  className="plan-views"
  value={view}
  onChange={setView}
  options={[
    { value: 'schedule', label: t('Schedule') },
    { value: 'routines', label: t('Routines') },
    { value: 'nutrition', label: t('Nutrition') }
  ]}
/>
```

### 3.2 View Content (`PlanNutrition.jsx` / `NutritionPlanView`)
When `view === 'nutrition'`:
1. **Target Summary Card**:
   - Primary daily target: `Calories (kcal/day)`, with strategy badge (Cutting / Bulking / Maintenance).
   - Target Macronutrients breakdown: Protein (g), Carbs (g), Fat (g) with caloric percentage indicators.
   - Physical profile summary: BMR & TDEE estimates, activity level, and AI Coach reasoning/strategy explanation.
   - Action Button: `<Button variant="tinted" icon="sparkles" onClick={openWizard}>Adjust with AI Wizard</Button>`.
2. **Workout Day vs Rest Day Strategy**:
   - Explains recommended nutritional adjustments based on the active routine schedule:
     - Training Days: Emphasizes pre/post-workout carbohydrate and protein timing.
     - Rest Days: Emphasizes recovery and steady caloric balance.
3. **Quick Actions**:
   - `<Button variant="primary" icon="plus" onClick={openFoodLogger}>Log Today's Food</Button>`.

---

## 4. Stats Page: "Nutrition" Analytics (`Stats.jsx`)

### 4.1 Segmented Navigation
Update `Stats.jsx` with a top-level tab switcher:
```jsx
<Segmented
  className="stats-views"
  value={tab}
  onChange={setTab}
  options={[
    { value: 'training', label: t('Training') },
    { value: 'nutrition', label: t('Nutrition') }
  ]}
/>
```

### 4.2 Tab Content (`StatsNutrition.jsx` / `NutritionStatsView`)
When `tab === 'nutrition'`:
1. **Calorie Intake Trend Chart**:
   - Uses OpenGym's native `LineChart` component.
   - Plots daily consumed calories over time with date range filters (`1M`, `3M`, `1Y`, `All`).
   - Displays the target calories line as a reference line (`goal={targetCal}`).
2. **Nutrition Adherence & Summary Metrics**:
   - Average daily calories consumed in selected period.
   - Target compliance rate (% of logged days within ±10% of target).
   - Total days logged.
3. **Macronutrient Breakdown Card**:
   - Average daily Protein, Carbs, Fat in grams and pie/bar distribution.
4. **Calorie & Body Weight Correlation**:
   - Side-by-side or dual comparison illustrating weight change trajectory relative to calorie surplus or deficit.
5. **Food Log History Table / List**:
   - Grouped by day, listing meals logged with calories and macros.
   - Provides an option to view or delete log entries.

---

## 5. UI & Styling Principles
- Strictly adhere to OpenGym design system:
  - Dark mode native cards (`.card`).
  - Native typography and theme color tokens (`var(--acc)`, `var(--label-1)`, `var(--label-2)`, `var(--sep)`, `var(--r-xl)`).
  - Responsive layouts with `minmax(0, 1fr)` avoiding mobile clipping.
  - Buttons using `<Button>` from `components/ui.jsx` with standard variants (`tinted`, `primary`, `ghost`).

---

## 6. Testing & Quality Assurance
- **Unit Tests**:
  - `Plan.nutrition.test.jsx`: Assert switching to the `Nutrition` tab renders target calories, macros, and adjustment triggers.
  - `Stats.nutrition.test.jsx`: Assert switching to the `Nutrition` tab displays calorie trend chart, summary cards, and log history.
- **Regression Check**:
  - Verify existing `Schedule` and `Routines` tabs in `Plan.jsx` remain unaffected.
  - Verify existing `Training` stats, charts, and 1RM calculations in `Stats.jsx` remain intact.
- **Docker Production Build & Healthcheck**:
  - Run Vite production build and verify in live Docker container.
