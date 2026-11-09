// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { AboutPage, DEVELOPER } from './AboutPage'

afterEach(cleanup)

describe('AboutPage', () => {
  it('shows the system description and the developer section', () => {
    render(<AboutPage />)
    expect(screen.getByRole('heading', { name: 'אודות המערכת' })).toBeInTheDocument()
    expect(screen.getByText('מערכת לניהול הוצאות אישיות')).toBeInTheDocument()
    expect(screen.getByText('הוספה, עדכון ומחיקה של הוצאות.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'אודות המפתח/ת' })).toBeInTheDocument()
  })

  it('shows real details when provided, otherwise a marked placeholder (never invented)', () => {
    render(<AboutPage />)
    if (DEVELOPER) {
      expect(screen.getByText(DEVELOPER.name, { selector: 'h3' })).toBeInTheDocument()
      expect(screen.getByRole('img', { name: `תמונת המפתח: ${DEVELOPER.name}` })).toBeInTheDocument()
    } else {
      expect(screen.getByText('פרטי המפתח/ת יתווספו בהמשך.')).toBeInTheDocument()
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    }
  })
})
