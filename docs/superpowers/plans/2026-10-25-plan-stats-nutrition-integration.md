# Plan & Stats Nutrition Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the Calorie Tracker & AI Nutrition features into both the Plan (`/plan`) and Stats (`/stats`) pages with dedicated views, interactive charts, and seamless connection to workout routines and bodyweight data.

**Architecture:** 
- In `Plan.jsx`, add a third segmented tab (`Schedule | Routines | Nutrition`), rendering `PlanNutrition.jsx` with daily calorie/macro targets, physical profile metrics (BMR/TDEE), training vs rest day nutritional guidance, and triggers for the AI Calorie Wizard and Food Logger.
- In `Stats.jsx`, add a top-level segmented navigation (`Training | Nutrition`), rendering `StatsNutrition.jsx` with a daily calorie intake trend `LineChart` against target goals, macro intake distributions, compliance stats, correlation with bodyweight changes, and daily meal log history.

**Tech Stack:** React 18, Zustand (`useStore.js`), Vitest, OpenGym design system & components (`LineChart`, `Segmented`, `Button`, `Icon`).

**Spec:** `docs/superpowers/specs/2026-10-25-plan-stats-nutrition-integration-design.md`

## Global Constraints
- Strictly adhere to OpenGym dark mode theme variables (`var(--acc)`, `var(--acc-soft)`, `var(--label-1)`, `var(--label-2)`, `var(--sep)`, `var(--r-xl)`).
- Use `Button` and `Segmented` from `components/ui.jsx` rather than ad-hoc buttons.
- Responsive mobile layout using `minmax(0, 1fr)` and `min-width: 0` to prevent horizontal clipping.
- Fully offline-first reading from Zustand `useStore(s => s.S)`.
- All tests must follow TDD (Red-Green-Refactor).

## Review Focus
1. User has no calorie target set yet (`S.nutritionTarget === null`): Plan and Stats must display clean empty state with button to launch AI Calorie Wizard without throwing errors.
2. User has no food logs recorded (`S.nutritionLogs === []`): Stats nutrition charts must display "No nutrition logs yet" without NaN or division by zero.
3. Date range filtering (1M, 3M, 1Y, All) in Stats must properly filter food log points and accurately compute average daily calories and compliance rate.
4. Switching between Schedule, Routines, and Nutrition in Plan must preserve existing routine editing and schedule pass states.
5. Switching between Training and Nutrition in Stats must not break or reset existing exercise 1RM and muscle fatigue charts.

---

### Task 1: Create `PlanNutrition.jsx` Component & Tests

**Files:**
- Create: `frontend/src/views/PlanNutrition.jsx`
- Test: `frontend/src/views/PlanNutrition.test.jsx`

**Interfaces:**
- Consumes: `useStore.js` (`S.nutritionTarget`, `S.nutritionLogs`, `S.workouts`), `components/ui.jsx` (`Button`), `components/Icon.jsx`
- Produces: `PlanNutrition({ S, onOpenWizard, onOpenLog })`

- [ ] **Step 1: Write the failing unit tests for `PlanNutrition`**

Create `frontend/src/views/PlanNutrition.test.jsx`:
```jsx
// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import PlanNutrition from './PlanNutrition.jsx'
import { useStore, DEF } from '../store/useStore.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
let host, root

beforeEach(() => {
  useStore.setState({
    S: {
      ...JSON.parse(JSON.stringify(DEF)),
      nutritionTarget: {
        calories: 2200,
        protein: 150,
        carbs: 220,
        fat: 65,
        strategy: 'maintain',
        bmr: 1750,
        tdee: 2200,
        reasoning: 'Balanced maintenance target tailored for moderate strength training.'
      },
      nutritionLogs: []
    },
    user: { id: 1 }
  })
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

describe('PlanNutrition', () => {
  it('renders target calories, strategy badge, and macronutrient targets', () => {
    act(() => {
      root.render(<PlanNutrition S={useStore.getState().S} onOpenWizard={() => {}} onOpenLog={() => {}} />)
    })
    expect(host.textContent).toContain('2,200')
    expect(host.textContent).toContain('150g')
    expect(host.textContent).toContain('220g')
    expect(host.textContent).toContain('65g')
    expect(host.textContent).toContain('Adjust with AI Wizard')
  })

  it('renders empty state when no nutrition target is set', () => {
    const emptyS = { ...useStore.getState().S, nutritionTarget: null }
    act(() => {
      root.render(<PlanNutrition S={emptyS} onOpenWizard={() => {}} onOpenLog={() => {}} />)
    })
    expect(host.textContent).toContain('No daily nutrition target set')
    expect(host.textContent).toContain('Start AI Calorie Wizard')
  })

  it('triggers onOpenWizard when adjust button is clicked', () => {
    let wizardOpened = false
    act(() => {
      root.render(
        <PlanNutrition
          S={useStore.getState().S}
          onOpenWizard={() => { wizardOpened = true }}
          onOpenLog={() => {}}
        />
      )
    })
    const btn = Array.from(host.querySelectorAll('button')).find(b => b.textContent.includes('AI Wizard'))
    expect(btn).toBeTruthy()
    act(() => { btn.click() })
    expect(wizardOpened).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/PlanNutrition.test.jsx` in `frontend`
Expected: FAIL (Cannot find module `./PlanNutrition.jsx`)

- [ ] **Step 3: Implement `PlanNutrition.jsx`**

Create `frontend/src/views/PlanNutrition.jsx`:
```jsx
import React from 'react'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import { t } from '../lib/i18n.js'

export default function PlanNutrition({ S, onOpenWizard, onOpenLog }) {
  const target = S?.nutritionTarget
  const targetCal = target ? Number(target.calories) || 0 : null
  const targetP = target ? Number(target.protein) || 0 : 0
  const targetC = target ? Number(target.carbs) || 0 : 0
  const targetF = target ? Number(target.fat) || 0 : 0

  const fmt = n => Number(n).toLocaleString()

  if (!targetCal) {
    return (
      <div className="card" style={{ padding: '24px 18px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 24,
            background: 'var(--acc-soft)', color: 'var(--acc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon name="sparkles" size={24} />
          </div>
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>{t('No daily nutrition target set')}</h2>
        <p style={{ margin: '0 auto 18px', maxWidth: 420, color: 'var(--label-2, rgba(255,255,255,0.7))', fontSize: 14, lineHeight: 1.5 }}>
          {t('Set your personal energy goals, calculate BMR/TDEE, and establish macro splits designed for your workout routine.')}
        </p>
        <Button variant="primary" icon="sparkles" onClick={onOpenWizard} style={{ margin: '0 auto' }}>
          {t('Start AI Calorie Wizard')}
        </Button>
      </div>
    )
  }

  // Energy percentage calculation
  const totalMacroCals = (targetP * 4) + (targetC * 4) + (targetF * 9)
  const pctP = totalMacroCals > 0 ? Math.round(((targetP * 4) / totalMacroCals) * 100) : 0
  const pctC = totalMacroCals > 0 ? Math.round(((targetC * 4) / totalMacroCals) * 100) : 0
  const pctF = totalMacroCals > 0 ? Math.round(((targetF * 9) / totalMacroCals) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Target Overview Card */}
      <div className="card">
        <div className="row between" style={{ alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Icon name="sparkles" size={16} style={{ color: 'var(--acc)' }} />
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--acc)' }}>
                {target.strategy ? target.strategy.toUpperCase() : 'DAILY TARGET'}
              </span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em' }}>
              {fmt(targetCal)} <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--label-2, rgba(255,255,255,0.6))' }}>kcal / day</span>
            </div>
          </div>
          <Button size="sm" variant="tinted" icon="sparkles" onClick={onOpenWizard}>
            {t('Adjust with AI Wizard')}
          </Button>
        </div>

        {/* Macro split breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 8 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--label-2, rgba(255,255,255,0.6))', textTransform: 'uppercase' }}>Protein</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#38bdf8', marginTop: 2 }}>{targetP}g</div>
            <div style={{ fontSize: 11, color: 'var(--label-2, rgba(255,255,255,0.5))', marginTop: 2 }}>{pctP}% cal</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--label-2, rgba(255,255,255,0.6))', textTransform: 'uppercase' }}>Carbs</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24', marginTop: 2 }}>{targetC}g</div>
            <div style={{ fontSize: 11, color: 'var(--label-2, rgba(255,255,255,0.5))', marginTop: 2 }}>{pctC}% cal</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--label-2, rgba(255,255,255,0.6))', textTransform: 'uppercase' }}>Fat</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f87171', marginTop: 2 }}>{targetF}g</div>
            <div style={{ fontSize: 11, color: 'var(--label-2, rgba(255,255,255,0.5))', marginTop: 2 }}>{pctF}% cal</div>
          </div>
        </div>

        {target.reasoning && (
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(16, 185, 129, 0.08)', borderLeft: '3px solid var(--acc)' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
              {target.reasoning}
            </div>
          </div>
        )}
      </div>

      {/* Training vs Rest Day Nutritional Strategy Card */}
      <div className="card">
        <h3 style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 700 }}>{t('Training & Rest Day Strategy')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ padding: 6, borderRadius: 8, background: 'var(--acc-soft)', color: 'var(--acc)' }}>
              <Icon name="dumbbell" size={16} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{t('Workout Days')}</div>
              <div style={{ fontSize: 12, color: 'var(--label-2, rgba(255,255,255,0.65))', lineHeight: 1.4, marginTop: 2 }}>
                {t('Prioritize complex carbohydrates 1-2 hours before training and 25-30g protein immediately post-workout to fuel intensity and muscle recovery.')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: 'var(--label-2, rgba(255,255,255,0.8))' }}>
              <Icon name="moon" size={16} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{t('Rest Days')}</div>
              <div style={{ fontSize: 12, color: 'var(--label-2, rgba(255,255,255,0.65))', lineHeight: 1.4, marginTop: 2 }}>
                {t('Keep protein intake high to support muscle protein synthesis, with slightly lower carbohydrates to match reduced energy expenditure.')}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--sep, rgba(255,255,255,0.1))', display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="sm" variant="primary" icon="plus" onClick={onOpenLog}>
            {t('Log Today’s Food')}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/PlanNutrition.test.jsx` in `frontend`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/PlanNutrition.jsx frontend/src/views/PlanNutrition.test.jsx
git commit -m "feat(plan): add PlanNutrition component and tests"
```

---

### Task 2: Integrate `Nutrition` Tab into `Plan.jsx`

**Files:**
- Modify: `frontend/src/views/Plan.jsx`
- Test: `frontend/src/views/Plan.nutrition.test.jsx`

**Interfaces:**
- Consumes: `PlanNutrition.jsx`, `NutritionWizardModal.jsx`, `FoodLoggerSheet.jsx`
- Produces: Updated `Plan.jsx` with 3-tab Segmented control (`schedule`, `routines`, `nutrition`)

- [ ] **Step 1: Write failing unit test for `Plan.jsx` with Nutrition tab**

Create `frontend/src/views/Plan.nutrition.test.jsx`:
```jsx
// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Plan from './Plan.jsx'
import { useStore, DEF } from '../store/useStore.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
let host, root

beforeEach(() => {
  useStore.setState({
    S: {
      ...JSON.parse(JSON.stringify(DEF)),
      routines: [],
      nutritionTarget: { calories: 2400, protein: 160, carbs: 240, fat: 70 }
    },
    user: { id: 1 }
  })
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

describe('Plan page with Nutrition view', () => {
  it('includes Nutrition in the Segmented tabs and renders PlanNutrition on click', () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <Plan />
        </MemoryRouter>
      )
    })

    const buttons = Array.from(host.querySelectorAll('.plan-views button, .plan-views .seg-opt, .seg-btn'))
    const nutritionTab = buttons.find(b => b.textContent.includes('Nutrition'))
    expect(nutritionTab).toBeTruthy()

    act(() => { nutritionTab.click() })

    expect(host.textContent).toContain('2,400')
    expect(host.textContent).toContain('160g')
    expect(host.textContent).toContain('Training & Rest Day Strategy')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/Plan.nutrition.test.jsx` in `frontend`
Expected: FAIL (Cannot find Nutrition tab or button)

- [ ] **Step 3: Update `Plan.jsx` to incorporate Nutrition view and drawers**

In `frontend/src/views/Plan.jsx`:
- Import `PlanNutrition` from `./PlanNutrition.jsx`
- Import `NutritionWizardModal` from `../components/NutritionWizardModal.jsx`
- Import `FoodLoggerSheet` from `../components/FoodLoggerSheet.jsx`
- Add modal state `[showWizard, setShowWizard] = useState(false)` and `[showFoodLogger, setShowFoodLogger] = useState(false)`
- Update `Segmented` options:
  ```jsx
  <Segmented className="plan-views" value={view} onChange={setView}
    options={[
      { value: 'schedule', label: t('Schedule') },
      { value: 'routines', label: t('Routines') },
      { value: 'nutrition', label: t('Nutrition') },
    ]} />
  ```
- Render `PlanNutrition` when `view === 'nutrition'`:
  ```jsx
  {view === 'routines'
    ? <Routines S={S} update={update} nav={nav} />
    : view === 'nutrition'
    ? <PlanNutrition S={S} onOpenWizard={() => setShowWizard(true)} onOpenLog={() => setShowFoodLogger(true)} />
    : <Schedule S={S} update={update} nav={nav} mode={mode} />}
  ```
- Render `<NutritionWizardModal open={showWizard} onClose={() => setShowWizard(false)} />` and `<FoodLoggerSheet open={showFoodLogger} onClose={() => setShowFoodLogger(false)} />`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/Plan.nutrition.test.jsx` in `frontend`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/Plan.jsx frontend/src/views/Plan.nutrition.test.jsx
git commit -m "feat(plan): add Nutrition tab to Plan view"
```

---

### Task 3: Create `StatsNutrition.jsx` Component & Tests

**Files:**
- Create: `frontend/src/views/StatsNutrition.jsx`
- Test: `frontend/src/views/StatsNutrition.test.jsx`

**Interfaces:**
- Consumes: `useStore.js` (`S.nutritionTarget`, `S.nutritionLogs`, `S.bodyweight`), `components/LineChart.jsx`, `components/ui.jsx` (`Segmented`, `Button`), `components/Icon.jsx`
- Produces: `StatsNutrition({ S, onOpenWizard, onOpenLog })`

- [ ] **Step 1: Write failing unit test for `StatsNutrition`**

Create `frontend/src/views/StatsNutrition.test.jsx`:
```jsx
// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import StatsNutrition from './StatsNutrition.jsx'
import { useStore, DEF } from '../store/useStore.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
let host, root

beforeEach(() => {
  useStore.setState({
    S: {
      ...JSON.parse(JSON.stringify(DEF)),
      nutritionTarget: { calories: 2000, protein: 140, carbs: 200, fat: 60 },
      nutritionLogs: [
        { id: '1', d: '2026-10-24', name: 'Chicken Rice', calories: 650, protein: 45, carbs: 70, fat: 15, meal: 'lunch' },
        { id: '2', d: '2026-10-24', name: 'Protein Shake', calories: 250, protein: 30, carbs: 10, fat: 3, meal: 'snack' },
        { id: '3', d: '2026-10-25', name: 'Oatmeal', calories: 350, protein: 12, carbs: 60, fat: 5, meal: 'breakfast' }
      ],
      bodyweight: [
        { d: '2026-10-20', w: 72.5 },
        { d: '2026-10-25', w: 72.0 }
      ]
    },
    user: { id: 1 }
  })
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

describe('StatsNutrition', () => {
  it('renders daily calorie chart, compliance stats, and average macronutrients', () => {
    act(() => {
      root.render(<StatsNutrition S={useStore.getState().S} onOpenWizard={() => {}} onOpenLog={() => {}} />)
    })
    expect(host.textContent).toContain('Calorie Intake')
    expect(host.textContent).toContain('Average Daily Intake')
    expect(host.textContent).toContain('Target Compliance')
    expect(host.textContent).toContain('Food Log History')
    expect(host.textContent).toContain('Chicken Rice')
  })

  it('renders friendly empty state when no nutrition logs exist', () => {
    const emptyS = { ...useStore.getState().S, nutritionLogs: [] }
    act(() => {
      root.render(<StatsNutrition S={emptyS} onOpenWizard={() => {}} onOpenLog={() => {}} />)
    })
    expect(host.textContent).toContain('No nutrition logs in this period')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/StatsNutrition.test.jsx` in `frontend`
Expected: FAIL (Cannot find module `./StatsNutrition.jsx`)

- [ ] **Step 3: Implement `StatsNutrition.jsx`**

Create `frontend/src/views/StatsNutrition.jsx`:
```jsx
import React, { useState, useMemo } from 'react'
import LineChart from '../components/LineChart.jsx'
import Icon from '../components/Icon.jsx'
import { Button, Segmented } from '../components/ui.jsx'
import { t } from '../lib/i18n.js'
import { fmtNum, fmtDate } from '../lib/format.js'

const rangeOptions = () => [
  { value: 30, label: '1M' },
  { value: 90, label: '3M' },
  { value: 365, label: '1Y' },
  { value: 0, label: t('All') }
]

export default function StatsNutrition({ S, onOpenWizard, onOpenLog }) {
  const [range, setRange] = useState(30)
  const target = S?.nutritionTarget
  const targetCal = target ? Number(target.calories) || 0 : null
  const logs = S?.nutritionLogs || []

  const now = Date.now()
  const rangeStart = range ? now - range * 86400000 : 0

  // Group logs by date
  const dailyData = useMemo(() => {
    const grouped = {}
    logs.forEach(log => {
      if (!log || !log.d) return
      const tstamp = new Date(log.d).getTime()
      if (rangeStart && tstamp < rangeStart) return
      if (!grouped[log.d]) {
        grouped[log.d] = { d: log.d, t: tstamp, calories: 0, protein: 0, carbs: 0, fat: 0, items: [] }
      }
      grouped[log.d].calories += (Number(log.calories) || 0)
      grouped[log.d].protein += (Number(log.protein) || 0)
      grouped[log.d].carbs += (Number(log.carbs) || 0)
      grouped[log.d].fat += (Number(log.fat) || 0)
      grouped[log.d].items.push(log)
    })
    return Object.values(grouped).sort((a, b) => a.d.localeCompare(b.d))
  }, [logs, rangeStart])

  // Chart points for LineChart
  const chartPoints = useMemo(() => {
    return dailyData.map(d => ({
      t: d.t,
      y: d.calories,
      d: d.d
    }))
  }, [dailyData])

  // Summary Metrics
  const totalDays = dailyData.length
  const avgCalories = totalDays > 0 ? Math.round(dailyData.reduce((acc, d) => acc + d.calories, 0) / totalDays) : 0
  const avgProtein = totalDays > 0 ? Math.round(dailyData.reduce((acc, d) => acc + d.protein, 0) / totalDays) : 0
  const avgCarbs = totalDays > 0 ? Math.round(dailyData.reduce((acc, d) => acc + d.carbs, 0) / totalDays) : 0
  const avgFat = totalDays > 0 ? Math.round(dailyData.reduce((acc, d) => acc + d.fat, 0) / totalDays) : 0

  // Compliance: % of days within ±15% of target
  const compliantDays = targetCal > 0
    ? dailyData.filter(d => Math.abs(d.calories - targetCal) <= targetCal * 0.15).length
    : 0
  const compliancePct = totalDays > 0 && targetCal > 0 ? Math.round((compliantDays / totalDays) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Calorie Trend Card */}
      <div className="card">
        <div className="row between" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>{t('Calorie Intake')}</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            <Button size="xs" variant="tinted" icon="sparkles" onClick={onOpenWizard}>
              {target ? `${fmtNum(targetCal)} kcal` : t('Set Target')}
            </Button>
            <Button size="xs" variant="primary" icon="plus" onClick={onOpenLog}>
              {t('Log')}
            </Button>
          </div>
        </div>

        <Segmented className="seg-range" value={range} onChange={setRange} options={rangeOptions()} />

        <div className="chart" style={{ marginTop: 8 }}>
          {chartPoints.length > 0 ? (
            <LineChart points={chartPoints} h={160} unit="kcal" goal={targetCal} color="var(--acc)" />
          ) : (
            <div className="empty small" style={{ padding: '24px 0', textAlign: 'center', color: 'var(--label-2)' }}>
              {t('No nutrition logs in this period. Log your food to see the trend.')}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--label-2)' }}>{t('Average Daily Intake')}</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: 'var(--acc)' }}>
            {avgCalories} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--label-2)' }}>kcal</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--label-2)', marginTop: 4 }}>
            {targetCal ? `${avgCalories >= targetCal ? '+' : ''}${avgCalories - targetCal} kcal ${t('vs target')}` : t('No target set')}
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--label-2)' }}>{t('Target Compliance')}</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: compliancePct >= 70 ? 'var(--acc)' : '#fbbf24' }}>
            {compliancePct}%
          </div>
          <div style={{ fontSize: 12, color: 'var(--label-2)', marginTop: 4 }}>
            {compliantDays} / {totalDays} {t('days on target')}
          </div>
        </div>
      </div>

      {/* Average Daily Macros */}
      <div className="card">
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>{t('Average Macronutrient Intake')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--label-2)' }}>Protein</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#38bdf8', marginTop: 2 }}>{avgProtein}g</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--label-2)' }}>Carbs</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24', marginTop: 2 }}>{avgCarbs}g</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--label-2)' }}>Fat</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f87171', marginTop: 2 }}>{avgFat}g</div>
          </div>
        </div>
      </div>

      {/* Food Log History */}
      <div className="card">
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>{t('Food Log History')}</h3>
        {dailyData.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dailyData.slice().reverse().map(day => (
              <div key={day.d} style={{ borderBottom: '1px solid var(--sep, rgba(255,255,255,0.08))', paddingBottom: 10 }}>
                <div className="row between" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{fmtDate(day.d, true)}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--acc)' }}>{day.calories} kcal</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {day.items.map(it => (
                    <div key={it.id || it.name} className="row between" style={{ fontSize: 12, color: 'var(--label-2)' }}>
                      <span>{it.name} <span style={{ opacity: 0.6 }}>({it.meal || 'food'})</span></span>
                      <span>{it.calories} kcal · P:{Math.round(it.protein || 0)}g</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--label-2)', fontSize: 13 }}>{t('No food items logged yet.')}</div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/StatsNutrition.test.jsx` in `frontend`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/StatsNutrition.jsx frontend/src/views/StatsNutrition.test.jsx
git commit -m "feat(stats): add StatsNutrition analytics component and tests"
```

---

### Task 4: Integrate `Nutrition` Tab into `Stats.jsx`

**Files:**
- Modify: `frontend/src/views/Stats.jsx`
- Test: `frontend/src/views/Stats.nutrition.test.jsx`

**Interfaces:**
- Consumes: `StatsNutrition.jsx`, `NutritionWizardModal.jsx`, `FoodLoggerSheet.jsx`
- Produces: Updated `Stats.jsx` with top Segmented switcher (`training`, `nutrition`)

- [ ] **Step 1: Write failing unit test for `Stats.jsx` with Nutrition tab**

Create `frontend/src/views/Stats.nutrition.test.jsx`:
```jsx
// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Stats from './Stats.jsx'
import { useStore, DEF } from '../store/useStore.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
let host, root

beforeEach(() => {
  useStore.setState({
    S: {
      ...JSON.parse(JSON.stringify(DEF)),
      workouts: [],
      bodyweight: [],
      nutritionTarget: { calories: 2100, protein: 150, carbs: 200, fat: 65 },
      nutritionLogs: [
        { id: '1', d: '2026-10-25', name: 'Steak & Salad', calories: 700, protein: 50, carbs: 20, fat: 30 }
      ]
    },
    user: { id: 1 }
  })
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

describe('Stats page with Nutrition tab', () => {
  it('includes Training and Nutrition top tabs and renders StatsNutrition on click', () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <Stats />
        </MemoryRouter>
      )
    })

    const buttons = Array.from(host.querySelectorAll('.stats-views button, .stats-views .seg-opt, .seg-btn'))
    const nutritionTab = buttons.find(b => b.textContent.includes('Nutrition'))
    expect(nutritionTab).toBeTruthy()

    act(() => { nutritionTab.click() })

    expect(host.textContent).toContain('Calorie Intake')
    expect(host.textContent).toContain('Average Daily Intake')
    expect(host.textContent).toContain('Steak & Salad')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/Stats.nutrition.test.jsx` in `frontend`
Expected: FAIL (Cannot find Nutrition tab in Stats)

- [ ] **Step 3: Update `Stats.jsx` with Segmented Navigation and Drawers**

In `frontend/src/views/Stats.jsx`:
- Import `StatsNutrition` from `./StatsNutrition.jsx`
- Import `NutritionWizardModal` from `../components/NutritionWizardModal.jsx`
- Import `FoodLoggerSheet` from `../components/FoodLoggerSheet.jsx`
- Add tab state `const [tab, setTab] = useState('training')`
- Add modal state `[showWizard, setShowWizard] = useState(false)` and `[showFoodLogger, setShowFoodLogger] = useState(false)`
- At the top of the Stats render (under the header):
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
- Render `StatsNutrition` when `tab === 'nutrition'`:
  ```jsx
  {tab === 'nutrition' ? (
    <StatsNutrition
      S={S}
      onOpenWizard={() => setShowWizard(true)}
      onOpenLog={() => setShowFoodLogger(true)}
    />
  ) : (
    // Existing training cards and charts
  )}
  ```
- Render `<NutritionWizardModal open={showWizard} onClose={() => setShowWizard(false)} />` and `<FoodLoggerSheet open={showFoodLogger} onClose={() => setShowFoodLogger(false)} />`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/Stats.nutrition.test.jsx` in `frontend`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/Stats.jsx frontend/src/views/Stats.nutrition.test.jsx
git commit -m "feat(stats): integrate Nutrition analytics tab into Stats view"
```

---

### Task 5: End-to-End Verification, Build & Docker Deployment

**Files:**
- Test: All nutrition tests and page test suites

- [ ] **Step 1: Run comprehensive frontend Vitest suite**

Run:
```bash
npx vitest run src/views/PlanNutrition.test.jsx src/views/Plan.nutrition.test.jsx src/views/StatsNutrition.test.jsx src/views/Stats.nutrition.test.jsx src/components/NutritionCard.test.jsx src/components/FoodLoggerSheet.test.jsx src/components/NutritionWizardModal.test.jsx
```
Expected: All tests PASS.

- [ ] **Step 2: Build frontend distribution**

Run: `npm run build` in `frontend`
Expected: Production build completes with exit code 0.

- [ ] **Step 3: Rebuild and restart web Docker container**

Run:
```bash
docker compose build web && docker compose up -d web
```
Expected: Container `opengym-web-1` running and healthy.

- [ ] **Step 4: Health check HTTP 200**

Run: `curl -ILs http://127.0.0.1:8080/ | head -n 5`
Expected: HTTP/1.1 200 OK.

- [ ] **Step 5: Final git review and clean commit on `main`**

Verify `git status` is clean on `main` without pushing to `origin/main`.
