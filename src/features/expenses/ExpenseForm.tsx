import { useId, useState, type FormEvent } from 'react'
import { CalendarDays, ChevronDown, Pencil, Plus } from 'lucide-react'
import { CATEGORIES, OTHER_CATEGORY } from '../../../shared/categories'
import { validateExpenseInput } from '../../../shared/expenseSchema'
import { todayLocal } from '../../../shared/dates'
import type { Expense, ExpenseInput, FieldErrors } from '../../../shared/types'
import { ApiRequestError } from '../../api/client'
import styles from './ExpenseForm.module.css'

type Props = {
  onSubmit: (input: ExpenseInput) => Promise<Expense>
  onSaved: (expense: Expense) => void
}

const emptyForm = (): ExpenseInput => ({
  category: '',
  description: '',
  amount: '',
  expenseDate: todayLocal(),
})

export const SAVE_FAILED_MESSAGE = 'השמירה נכשלה, ההוצאה לא נשמרה. נסו שוב.'

export function ExpenseForm({ onSubmit, onSaved }: Props) {
  const id = useId()
  const [values, setValues] = useState<ExpenseInput>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const today = todayLocal()
  const isOther = values.category === OTHER_CATEGORY

  function update(field: keyof ExpenseInput, value: string) {
    setValues((v) => ({ ...v, [field]: value }))
    // Clear the field's error once the user edits it
    setErrors((e) => {
      const next = { ...e }
      delete next[field]
      if (field === 'category') delete next.description
      return next
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaveError(null)

    const result = validateExpenseInput(values, today)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }

    setSaving(true)
    try {
      const saved = await onSubmit(values)
      setValues(emptyForm())
      setErrors({})
      onSaved(saved)
    } catch (err) {
      if (err instanceof ApiRequestError && err.fields) {
        setErrors(err.fields)
      } else {
        setSaveError(SAVE_FAILED_MESSAGE)
      }
    } finally {
      setSaving(false)
    }
  }

  const fieldId = (name: string) => `${id}-${name}`
  const errorId = (name: keyof ExpenseInput) => (errors[name] ? `${fieldId(name)}-error` : undefined)

  function FieldError({ name }: { name: keyof ExpenseInput }) {
    if (!errors[name]) return null
    return (
      <p id={`${fieldId(name)}-error`} className={styles.fieldError} role="alert">
        {errors[name]}
      </p>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor={fieldId('category')}>קטגוריה</label>
          <div className={styles.control}>
            <select
              id={fieldId('category')}
              value={values.category}
              onChange={(e) => update('category', e.target.value)}
              aria-invalid={!!errors.category}
              aria-describedby={errorId('category')}
              className={`${styles.input} ${styles.select} ${values.category === '' ? styles.placeholder : ''}`}
            >
              <option value="">בחר קטגוריה</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className={styles.iconEnd} size={18} aria-hidden="true" />
          </div>
          <FieldError name="category" />
        </div>

        <div className={styles.field}>
          <label htmlFor={fieldId('description')}>תיאור</label>
          <div className={styles.control}>
            <input
              id={fieldId('description')}
              type="text"
              value={values.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder={isOther ? 'תיאור ההוצאה (חובה)' : 'תיאור ההוצאה (אופציונלי)'}
              aria-invalid={!!errors.description}
              aria-describedby={errorId('description')}
              aria-required={isOther}
              maxLength={200}
              className={`${styles.input} ${styles.withIcon}`}
            />
            <Pencil className={styles.iconStart} size={16} aria-hidden="true" />
          </div>
          <FieldError name="description" />
        </div>

        <div className={styles.field}>
          <label htmlFor={fieldId('amount')}>סכום (₪)</label>
          <div className={styles.control}>
            <input
              id={fieldId('amount')}
              type="text"
              inputMode="decimal"
              dir="ltr"
              value={values.amount}
              onChange={(e) => update('amount', e.target.value)}
              placeholder="0.00"
              aria-invalid={!!errors.amount}
              aria-describedby={errorId('amount')}
              className={`${styles.input} ${styles.numeric} ${styles.withIcon}`}
            />
            <span className={styles.iconStart} aria-hidden="true">
              ₪
            </span>
          </div>
          <FieldError name="amount" />
        </div>

        <div className={styles.field}>
          <label htmlFor={fieldId('expenseDate')}>תאריך</label>
          <div className={styles.control}>
            <input
              id={fieldId('expenseDate')}
              type="date"
              value={values.expenseDate}
              max={today}
              onChange={(e) => update('expenseDate', e.target.value)}
              aria-invalid={!!errors.expenseDate}
              aria-describedby={errorId('expenseDate')}
              className={`${styles.input} ${styles.numeric} ${styles.date}`}
            />
            <CalendarDays className={styles.iconStart} size={16} aria-hidden="true" />
          </div>
          <FieldError name="expenseDate" />
        </div>
      </div>

      {saveError && (
        <p className={styles.saveError} role="alert">
          {saveError}
        </p>
      )}

      <div className={styles.actions}>
        <button type="submit" className={styles.primary} disabled={saving}>
          {saving ? 'שומר…' : 'הוסף הוצאה'}
          {!saving && <Plus size={18} aria-hidden="true" />}
        </button>
      </div>
    </form>
  )
}
