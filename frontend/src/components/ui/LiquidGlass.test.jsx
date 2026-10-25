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

  it('detects Chrome on iOS (CriOS) as webkit, not chromium', async () => {
    const { detectEngine, isIOS } = await import('./LiquidGlass.jsx')
    const originalUA = navigator.userAgent
    try {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.88 Mobile/15E148 Safari/604.1',
        configurable: true,
      })
      expect(isIOS()).toBe(true)
      expect(detectEngine(true)).toBe('webkit')
    } finally {
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUA,
        configurable: true,
      })
    }
  })

  it('renders webkit/iOS frosted glass without clipPath bug and with proper frosted backdrop layer', () => {
    act(() => {
      root.render(
        <LiquidGlass mode="frost" appearance="dark" material="clear" data-testid="ios-glass">
          <span>iOS Glass</span>
        </LiquidGlass>
      )
    })

    const el = host.querySelector('[data-testid="ios-glass"]')
    expect(el).not.toBeNull()
    expect(el.getAttribute('data-liquid-glass')).toBe('frost')

    // Lens element must not have clip-path in frost mode to avoid breaking WebKit backdrop-filter
    const lens = el.querySelector('span[aria-hidden="true"]')
    expect(lens).not.toBeNull()
    expect(lens.style.clipPath).toBeFalsy()
    expect(lens.style.backdropFilter).toContain('blur')
  })
})
