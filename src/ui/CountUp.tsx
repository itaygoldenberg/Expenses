import { useEffect, useRef, useState } from 'react'

const DURATION_MS = 600

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  if (document.documentElement.getAttribute('data-reduce-motion') === 'true') return true
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Shows a number that counts gently to its new value when it changes
 * (instantly with reduced motion). Screen readers get only the final value.
 */
export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)

  useEffect(() => {
    const start = from.current
    from.current = value
    if (start === value || prefersReducedMotion() || typeof requestAnimationFrame !== 'function') {
      setShown(value)
      return
    }
    const began = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - began) / DURATION_MS)
      const eased = 1 - (1 - t) ** 3
      setShown(t === 1 ? value : Math.round(start + (value - start) * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return (
    <>
      <span aria-hidden="true">{format(shown)}</span>
      <span className="visually-hidden">{format(value)}</span>
    </>
  )
}
