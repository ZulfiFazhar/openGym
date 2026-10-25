// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import NutritionWizardModal from './NutritionWizardModal.jsx'
import { useStore, DEF } from '../store/useStore.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
let host, root

beforeEach(() => {
  useStore.setState({ S: JSON.parse(JSON.stringify(DEF)), user: { id: 1 } })
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

describe('NutritionWizardModal', () => {
  it('renders step 1 and advances to step 2 when Next is clicked', () => {
    act(() => { root.render(<NutritionWizardModal open={true} onClose={() => {}} />) })
    expect(host.textContent).toContain('1/5')
    expect(host.textContent).toContain('Physical Profile')

    const nextBtn = host.querySelector('.wiz-btn-next')
    expect(nextBtn).toBeTruthy()
    act(() => { nextBtn.click() })

    expect(host.textContent).toContain('2/5')
    expect(host.textContent).toContain('Activity')
  })

  it('renders grab handle and no "x" close button, matching standard drawer design', () => {
    let closed = false
    act(() => { root.render(<NutritionWizardModal open={true} onClose={() => { closed = true }} />) })
    const grab = host.querySelector('.grab')
    expect(grab).toBeTruthy()
    expect(host.querySelector('.wiz-close')).toBeNull()

    act(() => { grab.click() })
    expect(closed).toBe(true)
  })

  it('closes on backdrop click and Escape key', () => {
    let closedCount = 0
    act(() => { root.render(<NutritionWizardModal open={true} onClose={() => { closedCount++ }} />) })
    const mback = host.querySelector('.mback')
    expect(mback).toBeTruthy()
    act(() => { mback.click() })
    expect(closedCount).toBe(1)

    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })) })
    expect(closedCount).toBe(2)
  })

  it('pre-fills target weight from S.targetW and renders target weight field in step 1', () => {
    useStore.setState({
      S: {
        ...JSON.parse(JSON.stringify(DEF)),
        bodyweight: [{ d: '2026-10-25', w: 75 }],
        targetW: 68
      },
      user: { id: 1 }
    })

    act(() => { root.render(<NutritionWizardModal open={true} onClose={() => {}} />) })

    const targetInput = host.querySelector('input[name="targetWeightKg"], input#targetWeightKg, input[data-field="targetWeight"]')
    expect(targetInput).toBeTruthy()
    expect(Number(targetInput.value)).toBe(68)
  })

  it('auto-selects Cutting goal when targetW is lower than current weight and shows recommendation', () => {
    useStore.setState({
      S: {
        ...JSON.parse(JSON.stringify(DEF)),
        bodyweight: [{ d: '2026-10-25', w: 75 }],
        targetW: 68
      },
      user: { id: 1 }
    })

    act(() => { root.render(<NutritionWizardModal open={true} onClose={() => {}} />) })

    // Step 1 -> 2 -> 3
    for (let i = 0; i < 2; i++) {
      const nextBtn = host.querySelector('.wiz-btn-next')
      act(() => { nextBtn.click() })
    }

    expect(host.textContent).toContain('Step 3/5')
    expect(host.textContent).toContain('Recommended: Cutting (75 kg to 68 kg)')
    const cutCard = host.querySelector('.wiz-option-card.selected')
    expect(cutCard).toBeTruthy()
    expect(cutCard.textContent).toContain('Cutting')
  })

  it('syncs updated target weight to S.targetW on apply and uses no emojis', async () => {
    useStore.setState({
      S: {
        ...JSON.parse(JSON.stringify(DEF)),
        bodyweight: [{ d: '2026-10-25', w: 75 }],
        targetW: null
      },
      user: { id: 1 }
    })

    act(() => { root.render(<NutritionWizardModal open={true} onClose={() => {}} />) })

    // Fill target weight in step 1
    const targetInput = host.querySelector('input[name="targetWeightKg"]')
    expect(targetInput).toBeTruthy()
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(targetInput, '70')
      targetInput.dispatchEvent(new Event('input', { bubbles: true }))
      targetInput.dispatchEvent(new Event('change', { bubbles: true }))
    })

    // Advance 1 -> 2 -> 3 -> 4
    for (let i = 0; i < 3; i++) {
      const nextBtn = host.querySelector('.wiz-btn-next')
      expect(nextBtn).toBeTruthy()
      act(() => { nextBtn.click() })
    }

    // Step 4 -> 5 (triggers async calculation)
    const calcBtn = host.querySelector('.wiz-btn-next')
    expect(calcBtn).toBeTruthy()
    await act(async () => {
      calcBtn.click()
      await new Promise(r => setTimeout(r, 50))
    })

    // On step 5 (results), check apply
    const applyBtn = host.querySelector('.wiz-btn-apply')
    expect(applyBtn).toBeTruthy()
    expect(applyBtn.disabled).toBe(false)
    act(() => { applyBtn.click() })

    expect(useStore.getState().S.targetW).toBe(70)

    // Verify no emojis in rendered text
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
    expect(emojiRegex.test(host.textContent)).toBe(false)
  })
})
