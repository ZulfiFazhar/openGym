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
})
