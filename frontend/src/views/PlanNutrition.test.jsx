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
