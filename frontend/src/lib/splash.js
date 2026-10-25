/**
 * Dismisses the static HTML splash screen with a smooth fade-out animation.
 *
 * @param {number} minDelay Minimum duration in ms before initiating fade-out.
 * @param {number} fadeDuration Duration in ms of the fade-out CSS transition before DOM removal.
 */
export function dismissSplash(minDelay = 1100, fadeDuration = 650) {
  const el = document.getElementById('app-splash')
  if (!el) return

  setTimeout(() => {
    el.classList.add('splash-fade-out')
    setTimeout(() => {
      try {
        el.remove()
      } catch {}
    }, fadeDuration)
  }, minDelay)
}
