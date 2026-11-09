import { useState, type FormEvent } from 'react'
import { Check, Plus } from 'lucide-react'
import { CATEGORIES, OTHER_CATEGORY } from '../../../shared/categories'
import { validateExpenseInput } from '../../../shared/expenseSchema'
import { todayLocal } from '../../../shared/dates'
import { isKind, KIND_LABELS, KINDS, kindHasCategory, type Kind } from '../../../shared/kinds'
import type { Expense, ExpenseInput, FieldErrors } from '../../../shared/types'
import { ApiRequestError } from '../../api/client'
import { Button, SegmentedControl, SelectField, TextField } from '../../ui'
import styles from './ExpenseForm.module.css'

type Props = {
  onSubmit: (input: ExpenseInput) => Promise<Expense>
  onSaved: (expense: Expense) => void
  /** 'edit' keeps the values after saving and shows "שמירה" / "ביטול". */
  mode?: 'create' | 'edit'
  initialValues?: ExpenseInput
  onCancel?: () => void
  /** Called when the server says the record no longer exists (404). */
  onNotFound?: () => void
}

type FormValues = ExpenseInput & { kind: Kind }

const emptyForm = (): FormValues => ({
  kind: 'expense',
  category: '',
  description: '',
  amount: '',
  expenseDate: todayLocal(),
})

export const SAVE_FAILED_MESSAGE = 'השמירה נכשלה, הרישום לא נשמר. נסו שוב.'
export const UPDATE_FAILED_MESSAGE = 'העדכון נכשל, הרישום לא עודכן. נסו שוב.'

const KIND_OPTIONS = KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] }))
const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c }))

/** Converts a record from the API to form values. */
export function expenseToInput(e: Expense): ExpenseInput {
  return {
    kind: e.kind,
    category: e.category ?? '',
    description: e.description ?? '',
    amount: e.amount,
    expenseDate: e.expenseDate,
  }
}

/** Form for adding or editing a record: expense / refund / income. */
export function ExpenseForm({ onSubmit, onSaved, mode = 'create', initialValues, onCancel, onNotFound }: Props) {
  const isEdit = mode === 'edit'
  const [values, setValues] = useState<FormValues>(() => {
    if (!initialValues) return emptyForm()
    return { ...initialValues, kind: isKind(initialValues.kind) ? initialValues.kind : 'expense' }
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const today = todayLocal()
  const hasCategory = kindHasCategory(values.kind)
  const isOther = hasCategory && values.category === OTHER_CATEGORY

  function update(field: keyof FormValues, value: string) {
    setValues((v) => ({ ...v, [field]: value }))
    // Clear the field's error once the user edits it
    setErrors((e) => {
      const next = { ...e }
      delete next[field]
      if (field === 'category' || field === 'kind') {
        delete next.description
        delete next.category
      }
      return next
    })
  }

  /** What is sent: income never carries a category. */
  function toInput(v: FormValues): ExpenseInput {
    return { ...v, category: kindHasCategory(v.kind) ? v.category : '' }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaveError(null)

    const input = toInput(values)
    const result = validateExpenseInput(input, today)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }

    setSaving(true)
    try {
      const saved = await onSubmit(input)
      if (!isEdit) setValues({ ...emptyForm(), kind: values.kind })
      setErrors({})
      onSaved(saved)
    } catch (err) {
      if (err instanceof ApiRequestError && err.fields) {
        setErrors(err.fields)
      } else if (err instanceof ApiRequestError && err.status === 404 && onNotFound) {
        onNotFound()
      } else {
        setSaveError(isEdit ? UPDATE_FAILED_MESSAGE : SAVE_FAILED_MESSAGE)
      }
    } finally {
      setSaving(false)
    }
  }

  const label = KIND_LABELS[values.kind]

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <SegmentedControl label="סוג" options={KIND_OPTIONS} value={values.kind} onChange={(k) => update('kind', k)} />

      <div className={styles.grid}>
        <TextField
          label="סכום (₪)"
          numeric
          className={styles.amount}
          startAdornment="₪"
          placeholder="0.00"
          value={values.amount}
          onChange={(e) => update('amount', e.target.value)}
          error={errors.amount}
        />
        <TextField
          label="תאריך"
          type="date"
          numeric
          max={today}
          value={values.expenseDate}
          onChange={(e) => update('expenseDate', e.target.value)}
          error={errors.expenseDate}
        />
        {hasCategory && (
          <SelectField
            label="קטגוריה"
            placeholder="בחרו קטגוריה"
            options={CATEGORY_OPTIONS}
            value={values.category}
            onChange={(e) => update('category', e.target.value)}
            error={errors.category}
          />
        )}
        <TextField
          label="תיאור"
          className={hasCategory ? undefined : styles.wide}
          placeholder={isOther ? `תיאור ה${label} (חובה)` : `תיאור ה${label} (אופציונלי)`}
          aria-required={isOther}
          maxLength={200}
          value={values.description}
          onChange={(e) => update('description', e.target.value)}
          error={errors.description}
        />
      </div>

      {errors.kind && (
        <p className={styles.saveError} role="alert">
          {errors.kind}
        </p>
      )}
      {saveError && (
        <p className={styles.saveError} role="alert">
          {saveError}
        </p>
      )}

      <div className={styles.actions}>
        <Button
          type="submit"
          loading={saving}
          icon={isEdit ? <Check size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
        >
          {saving ? 'שומר…' : isEdit ? 'שמירה' : `הוספת ${label}`}
        </Button>
        {isEdit && onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            ביטול
          </Button>
        )}
      </div>
    </form>
  )
}
