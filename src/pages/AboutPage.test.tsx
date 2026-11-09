// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { AboutPage, DEVELOPER, FEATURES, LINKS, TECH_STACK } from './AboutPage'

afterEach(cleanup)

describe('AboutPage (portfolio)', () => {
  it('shows the developer as provided: name, photo and description', () => {
    render(<AboutPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(`${DEVELOPER.name} — ${DEVELOPER.latinName}`)
    expect(screen.getByRole('img', { name: `תמונת המפתח: ${DEVELOPER.name}` })).toHaveAttribute('src', DEVELOPER.photo)
    expect(screen.getByText(DEVELOPER.description)).toBeInTheDocument()
  })

  it('lists the features and marks the ones not built yet as "בקרוב"', () => {
    render(<AboutPage />)
    for (const f of FEATURES) {
      const card = screen.getByRole('heading', { name: new RegExp(f.title) }).closest('article')!
      expect(within(card).queryByText('בקרוב') !== null).toBe(Boolean(f.soon))
    }
  })

  it('shows the technology chips and the footer', () => {
    render(<AboutPage />)
    for (const t of TECH_STACK) expect(screen.getByText(t)).toBeInTheDocument()
    expect(screen.getByText('Developed by Itay Goldenberg')).toBeInTheDocument()
    expect(screen.getByText('פותח בעזרת כלי AI (Claude Code) כחלק מתהליך הפיתוח.')).toBeInTheDocument()
  })

  it('hides GitHub / LinkedIn until links are provided', () => {
    render(<AboutPage />)
    if (!LINKS.github) expect(screen.queryByRole('link', { name: /GitHub/ })).not.toBeInTheDocument()
    if (!LINKS.linkedin) expect(screen.queryByRole('link', { name: /LinkedIn/ })).not.toBeInTheDocument()
  })
})
