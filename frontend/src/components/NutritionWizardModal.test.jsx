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
})
