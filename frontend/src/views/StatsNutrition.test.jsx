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
