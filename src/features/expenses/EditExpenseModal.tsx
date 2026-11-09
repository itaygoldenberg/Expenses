import { KIND_LABELS } from '../../../shared/kinds'
import type { Expense, ExpenseInput } from '../../../shared/types'
import { Modal } from '../../ui'
import { ExpenseForm, expenseToInput } from './ExpenseForm'

type Props = {
  expense: Expense
  onSubmit: (id: string, input: ExpenseInput) => Promise<Expense>
  onSaved: (expense: Expense) => void
  onNotFound: () => void
  onClose: () => void
}

export function EditExpenseModal({ expense, onSubmit, onSaved, onNotFound, onClose }: Props) {
  return (
    <Modal title={`עדכון ${KIND_LABELS[expense.kind]}`} onClose={onClose}>
      <ExpenseForm
        mode="edit"
        initialValues={expenseToInput(expense)}
        onSubmit={(input) => onSubmit(expense.id, input)}
        onSaved={onSaved}
        onNotFound={onNotFound}
        onCancel={onClose}
      />
    </Modal>
  )
}
