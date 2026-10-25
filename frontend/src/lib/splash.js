/**
 * Dismisses the static HTML splash screen with a smooth fade-out animation.
 *
 * @param {number} minDelay Minimum duration in ms before initiating fade-out.
 */
export function dismissSplash(minDelay = 700) {
  const el = document.getElementById('app-splash')
  if (!el) return

  setTimeout(() => {
    el.classList.add('splash-fade-out')
    setTimeout(() => {
      try {
        el.remove()
      } catch {}
    }, 400)
  }, minDelay)
}
