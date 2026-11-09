// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Expense } from '../../../shared/types'
import { ApiRequestError } from '../../api/client'
import { ExpenseList } from './ExpenseList'
import { EditExpenseModal } from './EditExpenseModal'
import { DeleteExpenseDialog, DELETE_FAILED_MESSAGE } from './DeleteExpenseDialog'
import { UPDATE_FAILED_MESSAGE } from './ExpenseForm'
import { DEFAULT_SORT } from './sortExpenses'

afterEach(cleanup)

const expense: Expense = {
  id: '05af603f-25ed-424c-9010-1f9d27293e44',
  kind: 'expense',
  category: 'דלק',
  description: 'תדלוק',
  amount: '180.00',
  expenseDate: '2026-11-06',
}

describe('ExpenseList', () => {
  function setup() {
    const props = {
      expenses: [expense],
      sort: DEFAULT_SORT,
      onSortColumn: vi.fn(),
      onSortChange: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    }
    render(<ExpenseList {...props} />)
    return { ...props, user: userEvent.setup() }
  }

  it('marks the default sort column and sorts on header click', async () => {
    const { onSortColumn, user } = setup()
    const table = screen.getByRole('table')
    expect(within(table).getByRole('columnheader', { name: /תאריך/ })).toHaveAttribute('aria-sort', 'descending')
    expect(within(table).getByRole('columnheader', { name: /סכום/ })).toHaveAttribute('aria-sort', 'none')
    await user.click(within(table).getByRole('button', { name: /קטגוריה/ }))
    expect(onSortColumn).toHaveBeenCalledWith('category')
  })

  it('changes sort from the mobile select', async () => {
    const { onSortChange, user } = setup()
    await user.selectOptions(screen.getByLabelText('מיון'), 'amount-asc')
    expect(onSortChange).toHaveBeenCalledWith({ key: 'amount', direction: 'asc' })
  })

  it('opens edit and delete for the right expense', async () => {
    const { onEdit, onDelete, user } = setup()
    const table = screen.getByRole('table')
    await user.click(within(table).getByRole('button', { name: /^עדכון/ }))
    await user.click(within(table).getByRole('button', { name: /^מחיקה/ }))
    expect(onEdit).toHaveBeenCalledWith(expense)
    expect(onDelete).toHaveBeenCalledWith(expense)
  })
})

describe('EditExpenseModal', () => {
  function setup(onSubmit = vi.fn().mockResolvedValue(expense)) {
    const props = { onSaved: vi.fn(), onNotFound: vi.fn(), onClose: vi.fn() }
    render(<EditExpenseModal expense={expense} onSubmit={onSubmit} {...props} />)
    return { ...props, onSubmit, user: userEvent.setup() }
  }
  const amount = () => screen.getByLabelText('סכום (₪)') as HTMLInputElement

  it('is filled with the expense details', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'עדכון הוצאה' })).toBeInTheDocument()
    expect(amount().value).toBe('180.00')
    expect((screen.getByLabelText('תיאור') as HTMLInputElement).value).toBe('תדלוק')
    expect((screen.getByLabelText('קטגוריה') as HTMLSelectElement).value).toBe('דלק')
  })

  it('does not save invalid input and lets the user fix it', async () => {
    const { onSubmit, onSaved, user } = setup()
    await user.clear(amount())
    await user.type(amount(), '0')
    await user.click(screen.getByRole('button', { name: /שמירה/ }))
    expect(screen.getByText('יש להזין סכום חיובי')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
    await user.clear(amount())
    await user.type(amount(), '200')
    await user.click(screen.getByRole('button', { name: /שמירה/ }))
    expect(onSubmit).toHaveBeenCalledWith(expense.id, expect.objectContaining({ amount: '200' }))
    expect(onSaved).toHaveBeenCalled()
  })

  it('stays open with a message when saving fails', async () => {
    const { onSaved, user } = setup(vi.fn().mockRejectedValue(new ApiRequestError('network', 0)))
    await user.click(screen.getByRole('button', { name: /שמירה/ }))
    expect(screen.getByText(UPDATE_FAILED_MESSAGE)).toBeInTheDocument()
    expect(amount().value).toBe('180.00')
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('reports a missing expense instead of success', async () => {
    const { onSaved, onNotFound, user } = setup(vi.fn().mockRejectedValue(new ApiRequestError('gone', 404)))
    await user.click(screen.getByRole('button', { name: /שמירה/ }))
    expect(onNotFound).toHaveBeenCalled()
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('cancel closes without saving', async () => {
    const { onSubmit, onClose, user } = setup()
    await user.click(screen.getByRole('button', { name: /ביטול/ }))
    expect(onClose).toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('DeleteExpenseDialog', () => {
  function setup(onConfirm = vi.fn().mockResolvedValue(undefined)) {
    const props = { onDeleted: vi.fn(), onNotFound: vi.fn(), onClose: vi.fn() }
    render(<DeleteExpenseDialog expense={expense} onConfirm={onConfirm} {...props} />)
    return { ...props, onConfirm, user: userEvent.setup() }
  }

  it('shows the expense and focuses cancel first', () => {
    setup()
    expect(screen.getByText('למחוק את ההוצאה?')).toBeInTheDocument()
    expect(screen.getByText('תדלוק · דלק')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ביטול' })).toHaveFocus()
  })

  it('cancel does not delete', async () => {
    const { onConfirm, onClose, user } = setup()
    await user.click(screen.getByRole('button', { name: 'ביטול' }))
    expect(onClose).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('deletes once after confirmation', async () => {
    const { onConfirm, onDeleted, user } = setup()
    await user.click(screen.getByRole('button', { name: /מחיקה/ }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onConfirm).toHaveBeenCalledWith(expense.id)
    expect(onDeleted).toHaveBeenCalled()
  })

  it('stays open with a message when deleting fails', async () => {
    const { onDeleted, user } = setup(vi.fn().mockRejectedValue(new ApiRequestError('network', 0)))
    await user.click(screen.getByRole('button', { name: /מחיקה/ }))
    expect(screen.getByText(DELETE_FAILED_MESSAGE)).toBeInTheDocument()
    expect(onDeleted).not.toHaveBeenCalled()
  })

  it('reports a missing expense instead of success', async () => {
    const { onDeleted, onNotFound, user } = setup(vi.fn().mockRejectedValue(new ApiRequestError('gone', 404)))
    await user.click(screen.getByRole('button', { name: /מחיקה/ }))
    expect(onNotFound).toHaveBeenCalled()
    expect(onDeleted).not.toHaveBeenCalled()
  })
})
