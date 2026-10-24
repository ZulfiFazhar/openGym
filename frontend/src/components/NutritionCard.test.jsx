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
    expect(host.textContent).toContain('Catat Makanan')
  })
})
