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

  it('renders webkit/iOS frosted glass without clipPath bug and without border strokes (pure glassmorphism)', () => {
    const origWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
    const origHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 390 })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 58 })

    try {
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

      const spans = el.querySelectorAll('span[aria-hidden="true"]')
      expect(spans.length).toBeGreaterThan(1)
      const lens = spans[0]
      expect(lens.style.clipPath).toBeFalsy()
      expect(lens.style.backdropFilter).toContain('blur')

      // Glassmorphism on iOS matches 21st.dev liquid-glass layer architecture
      spans.forEach((s) => {
        expect(s.style.border || 'none').toMatch(/^(none|0px)?(\s*(none|0px))*$/)
        expect(s.style.backgroundImage || 'none').not.toContain('data:image')
      })
      const hasInsetReflection = Array.from(spans).some((s) => s.style.boxShadow?.includes('inset'))
      expect(hasInsetReflection).toBe(true)
    } finally {
      if (origWidth) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', origWidth)
      if (origHeight) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', origHeight)
    }
  })

  it('exports standalone 21st.dev liquid-glass components (GlassEffect, GlassButton, GlassFilter) in tsx', async () => {
    const { GlassEffect, GlassButton, GlassFilter, GlassDock } = await import('./liquid-glass.tsx')
    expect(GlassEffect).toBeDefined()
    expect(GlassButton).toBeDefined()
    expect(GlassFilter).toBeDefined()
    expect(GlassDock).toBeDefined()

    act(() => {
      root.render(
        <GlassButton data-testid="standalone-glass-tsx-btn">
          <span>Standalone Glass TSX</span>
        </GlassButton>
      )
    })

    const el = host.querySelector('[data-testid="standalone-glass-tsx-btn"]')
    expect(el).not.toBeNull()
    expect(el.textContent).toBe('Standalone Glass TSX')
  })
})
