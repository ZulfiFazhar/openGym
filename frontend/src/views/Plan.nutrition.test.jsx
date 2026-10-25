// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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
