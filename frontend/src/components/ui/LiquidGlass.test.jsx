// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LiquidGlass, LiquidGlassButton } from './LiquidGlass.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let host, root

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

describe('LiquidGlass component', () => {
  it('renders a surface with liquid-glass attributes and lens layers', () => {
    act(() => {
      root.render(
        <LiquidGlass appearance="dark" material="clear" data-testid="glass-box">
          <span>Glass content</span>
        </LiquidGlass>
      )
    })

    const el = host.querySelector('[data-testid="glass-box"]')
    expect(el).not.toBeNull()
    expect(el.getAttribute('data-liquid-glass')).toMatch(/frost|refract/)
    expect(el.getAttribute('data-appearance')).toBe('dark')
    expect(el.getAttribute('data-material')).toBe('clear')
    expect(el.textContent).toBe('Glass content')
  })

  it('renders LiquidGlassButton with interactive properties and handles click', () => {
    const handleClick = vi.fn()
    act(() => {
      root.render(
        <LiquidGlassButton appearance="light" interactive onClick={handleClick} data-testid="glass-btn">
          Click me
        </LiquidGlassButton>
      )
    })

    const btn = host.querySelector('[data-testid="glass-btn"]')
    expect(btn).not.toBeNull()
    expect(btn.tagName.toLowerCase()).toBe('button')
    expect(btn.getAttribute('data-appearance')).toBe('light')

    act(() => {
      btn.click()
    })
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
