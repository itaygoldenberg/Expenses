import { useEffect, useState } from 'react'

/** True while the media query matches (false where matchMedia is not available, e.g. tests). */
export function useMediaQuery(query: string): boolean {
  const get = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches
  const [matches, setMatches] = useState(get)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const list = window.matchMedia(query)
    const onChange = () => setMatches(list.matches)
    onChange()
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** Matches the tablet / desktop layouts (DESIGN 2.6 breakpoint). */
export const WIDE_SCREEN = '(min-width: 768px)'
