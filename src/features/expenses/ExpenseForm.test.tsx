// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpenseForm, SAVE_FAILED_MESSAGE } from './ExpenseForm'
import { ApiRequestError } from '../../api/client'
import { todayLocal } from '../../../shared/dates'
import type { Expense } from '../../../shared/types'

afterEach(cleanup)

const saved: Expense = {
  id: '1',
  kind: 'expense',
  category: 'מזון',
  description: null,
  amount: '12.50',
  expenseDate: todayLocal(),
}

function setup(onSubmit = vi.fn().mockResolvedValue(saved)) {
  const onSaved = vi.fn()
  render(<ExpenseForm onSubmit={onSubmit} onSaved={onSaved} />)
  return { onSubmit, onSaved, user: userEvent.setup() }
}

describe('ExpenseForm', () => {
  it("defaults the date to today and doesn't allow future dates", () => {
    setup()
    const date = screen.getByLabelText('תאריך') as HTMLInputElement
    expect(date.value).toBe(todayLocal())
    expect(date.max).toBe(todayLocal())
  })

  it('shows required-field errors and does not call the API', async () => {
    const { onSubmit, user } = setup()
    await user.click(screen.getByRole('button', { name: /הוספת הוצאה/ }))
    expect(screen.getByText('יש לבחור קטגוריה')).toBeInTheDocument()
    expect(screen.getByText('יש להזין סכום')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('requires a description for "אחר" and rejects bad amounts', async () => {
    const { onSubmit, user } = setup()
    await user.selectOptions(screen.getByLabelText('קטגוריה'), 'אחר')
    await user.type(screen.getByLabelText('סכום (₪)'), '1.234')
    await user.click(screen.getByRole('button', { name: /הוספת הוצאה/ }))
    expect(screen.getByText("בקטגוריה 'אחר' יש להזין תיאור")).toBeInTheDocument()
    expect(screen.getByText('עד שתי ספרות אחרי הנקודה')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits valid input, then resets the form', async () => {
    const { onSubmit, onSaved, user } = setup()
    await user.selectOptions(screen.getByLabelText('קטגוריה'), 'מזון')
    await user.type(screen.getByLabelText('סכום (₪)'), '12.5')
    await user.click(screen.getByRole('button', { name: /הוספת הוצאה/ }))
    expect(onSubmit).toHaveBeenCalledWith({
      kind: 'expense',
      category: 'מזון',
      description: '',
      amount: '12.5',
      expenseDate: todayLocal(),
    })
    expect(onSaved).toHaveBeenCalledWith(saved)
    expect((screen.getByLabelText('סכום (₪)') as HTMLInputElement).value).toBe('')
  })

  it('keeps the input and shows an error when saving fails', async () => {
    const { onSaved, user } = setup(vi.fn().mockRejectedValue(new ApiRequestError('network', 0)))
    await user.selectOptions(screen.getByLabelText('קטגוריה'), 'דלק')
    await user.type(screen.getByLabelText('סכום (₪)'), '180')
    await user.click(screen.getByRole('button', { name: /הוספת הוצאה/ }))
    expect(screen.getByText(SAVE_FAILED_MESSAGE)).toBeInTheDocument()
    expect((screen.getByLabelText('סכום (₪)') as HTMLInputElement).value).toBe('180')
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('shows server-side field errors', async () => {
    const { user } = setup(
      vi.fn().mockRejectedValue(new ApiRequestError('invalid', 400, { expenseDate: 'לא ניתן לבחור תאריך עתידי' })),
    )
    await user.selectOptions(screen.getByLabelText('קטגוריה'), 'דלק')
    await user.type(screen.getByLabelText('סכום (₪)'), '180')
    await user.click(screen.getByRole('button', { name: /הוספת הוצאה/ }))
    expect(screen.getByText('לא ניתן לבחור תאריך עתידי')).toBeInTheDocument()
  })

  it('hides the category for income and sends none', async () => {
    const { onSubmit, user } = setup()
    expect(screen.getByRole('radio', { name: 'הוצאה' })).toHaveAttribute('aria-checked', 'true')
    await user.selectOptions(screen.getByLabelText('קטגוריה'), 'מזון')
    await user.click(screen.getByRole('radio', { name: 'הכנסה' }))
    expect(screen.queryByLabelText('קטגוריה')).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('סכום (₪)'), '5000')
    await user.click(screen.getByRole('button', { name: /הוספת הכנסה/ }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ kind: 'income', category: '', amount: '5000' }))
  })

  it('a refund still needs a category', async () => {
    const { onSubmit, user } = setup()
    await user.click(screen.getByRole('radio', { name: 'זיכוי' }))
    await user.type(screen.getByLabelText('סכום (₪)'), '20')
    await user.click(screen.getByRole('button', { name: /הוספת זיכוי/ }))
    expect(screen.getByText('יש לבחור קטגוריה')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
