// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import NutritionCard from './NutritionCard.jsx'
import { useStore, DEF } from '../store/useStore.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
let host, root

beforeEach(() => {
  useStore.setState({
    S: {
      ...JSON.parse(JSON.stringify(DEF)),
      nutritionTarget: { calories: 2200, protein: 150, carbs: 220, fat: 65 },
      nutritionLogs: [
        { id: '1', d: new Date().toISOString().slice(0, 10), name: 'Salad', calories: 400, protein: 20, carbs: 30, fat: 10 }
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

describe('NutritionCard', () => {
  it('displays calories consumed vs target correctly', () => {
    act(() => { root.render(<NutritionCard onOpenLog={() => {}} onOpenWizard={() => {}} />) })
    expect(host.textContent).toContain('400')
    expect(host.textContent).toContain('2,200')
    expect(host.textContent).toContain('Log Food')
    expect(host.textContent).toContain("Today's Nutrition")
  })

  it('renders Edit Target button with sparkles AI icon and tinted variant in dedicated actions row below title', () => {
    act(() => { root.render(<NutritionCard onOpenLog={() => {}} onOpenWizard={() => {}} />) })
    
    // Check that title row does NOT contain the buttons directly inside it
    const title = host.querySelector('h2')
    expect(title).toBeTruthy()
    expect(title.textContent).toBe("Today's Nutrition")
    const titleRow = title.parentElement
    expect(titleRow.querySelector('button')).toBeNull()

    // Check actions row below title
    const actionsRow = host.querySelector('.nutrition-card-actions')
    expect(actionsRow).toBeTruthy()

    // Edit Target button should have sparkles icon and tinted variant
    const editBtn = actionsRow.querySelector('button.tinted')
    expect(editBtn).toBeTruthy()
    expect(editBtn.textContent).toContain('Edit Target')
    expect(editBtn.querySelector('.icn, [data-icon="sparkles"], svg')).toBeTruthy()

    // Log Food button should have plus icon and primary variant
    const logBtn = actionsRow.querySelector('button.primary')
    expect(logBtn).toBeTruthy()
    expect(logBtn.textContent).toContain('Log Food')
  })

  it('triggers onOpenWizard and onOpenLog when respective buttons are clicked', () => {
    let wizardOpened = false
    let logOpened = false
    act(() => {
      root.render(
        <NutritionCard
          onOpenLog={() => { logOpened = true }}
          onOpenWizard={() => { wizardOpened = true }}
        />
      )
    })

    const actionsRow = host.querySelector('.nutrition-card-actions')
    const editBtn = actionsRow.querySelector('button.tinted')
    const logBtn = actionsRow.querySelector('button.primary')

    act(() => { editBtn.click() })
    expect(wizardOpened).toBe(true)

    act(() => { logBtn.click() })
    expect(logOpened).toBe(true)
  })
})
