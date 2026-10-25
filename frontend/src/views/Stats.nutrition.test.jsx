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
