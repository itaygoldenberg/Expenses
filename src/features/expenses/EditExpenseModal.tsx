import type { Expense, ExpenseInput } from '../../../shared/types'
import { Modal } from '../../components/Modal'
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
    <Modal title="עדכון הוצאה" onClose={onClose}>
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
