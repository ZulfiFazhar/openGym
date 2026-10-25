// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import FoodLoggerSheet from './FoodLoggerSheet.jsx'
import { useStore, DEF } from '../store/useStore.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
let host, root

beforeEach(() => {
  useStore.setState({
    S: {
      ...JSON.parse(JSON.stringify(DEF)),
      nutritionLogs: [
        { id: 'test-1', d: '2026-10-24', name: 'Oatmeal with Honey', calories: 300, protein: 10, carbs: 50, fat: 5, meal: 'breakfast' }
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

describe('FoodLoggerSheet', () => {
  it('renders logged foods for today and shows total calories', () => {
    act(() => { root.render(<FoodLoggerSheet open={true} onClose={() => {}} date="2026-10-24" />) })
    expect(host.textContent).toContain('Oatmeal with Honey')
    expect(host.textContent).toContain('300')
    expect(host.textContent).toContain('Log Food')
  })

  it('renders grab handle and no "x" close button, matching standard drawer design', () => {
    let closed = false
    act(() => { root.render(<FoodLoggerSheet open={true} onClose={() => { closed = true }} date="2026-10-24" />) })
    const grab = host.querySelector('.grab')
    expect(grab).toBeTruthy()
    expect(host.querySelector('.food-sheet-close')).toBeNull()

    act(() => { grab.click() })
    expect(closed).toBe(true)
  })

  it('closes on backdrop click and Escape key', () => {
    let closedCount = 0
    act(() => { root.render(<FoodLoggerSheet open={true} onClose={() => { closedCount++ }} date="2026-10-24" />) })
    const mback = host.querySelector('.mback')
    expect(mback).toBeTruthy()
    act(() => { mback.click() })
    expect(closedCount).toBe(1)

    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })) })
    expect(closedCount).toBe(2)
  })
})
