import { useId } from 'react'

/** App mark: three rising bars in Soft Blue → Cyan. */
export function Logo({ size = 28 }: { size?: number }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#6EA8FF" />
          <stop offset="1" stopColor="#5FD4E8" />
        </linearGradient>
      </defs>
      <rect x="3" y="13" width="4" height="8" rx="2" fill={`url(#${id})`} />
      <rect x="10" y="8" width="4" height="13" rx="2" fill={`url(#${id})`} />
      <rect x="17" y="3" width="4" height="18" rx="2" fill={`url(#${id})`} />
    </svg>
  )
}
