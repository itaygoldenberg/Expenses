import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { isRtl, nextIndex } from './rovingKeys'
import { cx } from './cx'
import styles from './Tabs.module.css'

type Tab = { id: string; label: string; content: ReactNode }

type Props = {
  label: string
  tabs: Tab[]
  /** Controlled selection (optional). */
  value?: string
  onChange?: (id: string) => void
}

/** Tabs with arrow-key navigation (automatic activation) and a sliding underline. */
export function Tabs({ label, tabs, value, onChange }: Props) {
  const base = useId()
  const [inner, setInner] = useState(tabs[0]?.id ?? '')
  const current = value ?? inner
  const selected = Math.max(
    0,
    tabs.findIndex((t) => t.id === current),
  )
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const [bar, setBar] = useState({ left: 0, width: 0 })

  // Measure the active tab so the underline can slide to it
  useLayoutEffect(() => {
    const el = refs.current[selected]
    if (el) setBar({ left: el.offsetLeft, width: el.offsetWidth })
  }, [selected, tabs.length])

  function select(i: number) {
    const id = tabs[i].id
    if (value === undefined) setInner(id)
    onChange?.(id)
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const next = nextIndex(e.key, selected, tabs.length, isRtl(e.currentTarget))
    if (next === null) return
    e.preventDefault()
    select(next)
    refs.current[next]?.focus()
  }

  const barStyle = { transform: `translateX(${bar.left}px)`, width: bar.width } as CSSProperties

  return (
    <div className={styles.tabs}>
      <div role="tablist" aria-label={label} className={styles.list} onKeyDown={onKeyDown}>
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${t.id}`}
            aria-selected={i === selected}
            aria-controls={`${base}-panel-${t.id}`}
            tabIndex={i === selected ? 0 : -1}
            className={cx(styles.tab, i === selected && styles.active)}
            onClick={() => select(i)}
          >
            {t.label}
          </button>
        ))}
        <span className={styles.indicator} style={barStyle} aria-hidden="true" />
      </div>
      {tabs.map((t, i) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-panel-${t.id}`}
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={i !== selected}
          tabIndex={0}
          className={styles.panel}
        >
          {i === selected && t.content}
        </div>
      ))}
    </div>
  )
}
