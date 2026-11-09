// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  IconButton,
  Modal,
  PasswordField,
  SegmentedControl,
  Sheet,
  Tabs,
  TextField,
  Toast,
  Tooltip,
  UploadArea,
  type ToastMessage,
} from './index'
import { nextIndex } from './rovingKeys'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('Button', () => {
  it('blocks clicks when disabled or loading', async () => {
    const onClick = vi.fn()
    const { rerender } = render(
      <Button onClick={onClick} disabled>
        שמירה
      </Button>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'שמירה' }))
    rerender(
      <Button onClick={onClick} loading>
        שמירה
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'שמירה' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('defaults to type="button"', () => {
    render(<Button>פעולה</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })
})

describe('TextField', () => {
  it('links the error message and marks the input invalid', () => {
    render(<TextField label="סכום" error="יש להזין סכום" hint="בשקלים" numeric />)
    const input = screen.getByLabelText('סכום')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('בשקלים יש להזין סכום')
    expect(input).toHaveAttribute('dir', 'ltr')
  })

  it('is valid without an error', () => {
    render(<TextField label="תיאור" />)
    expect(screen.getByLabelText('תיאור')).not.toHaveAttribute('aria-invalid')
  })
})

describe('PasswordField', () => {
  it('shows and hides the password', async () => {
    render(<PasswordField label="סיסמה" />)
    const input = screen.getByLabelText('סיסמה')
    const toggle = screen.getByRole('button', { name: 'הצגת הסיסמה' })
    expect(input).toHaveAttribute('type', 'password')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(toggle)
    expect(input).toHaveAttribute('type', 'text')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('arrow keys (RTL)', () => {
  it('moves forward with ArrowLeft and wraps; Home / End jump', () => {
    expect(nextIndex('ArrowLeft', 0, 3)).toBe(1)
    expect(nextIndex('ArrowRight', 0, 3)).toBe(2)
    expect(nextIndex('ArrowLeft', 2, 3)).toBe(0)
    expect(nextIndex('Home', 2, 3)).toBe(0)
    expect(nextIndex('End', 0, 3)).toBe(2)
    expect(nextIndex('ArrowRight', 0, 3, false)).toBe(1)
    expect(nextIndex('a', 0, 3)).toBeNull()
  })
})

function Segmented() {
  const [value, setValue] = useState<'a' | 'b' | 'c'>('a')
  return (
    <div dir="rtl">
      <SegmentedControl
        label="תצוגה"
        value={value}
        onChange={setValue}
        options={[
          { value: 'a', label: 'חודש' },
          { value: 'b', label: 'שנה' },
          { value: 'c', label: 'הכול' },
        ]}
      />
    </div>
  )
}

describe('SegmentedControl', () => {
  it('selects with arrows (RTL), Home and End', async () => {
    render(<Segmented />)
    const month = screen.getByRole('radio', { name: 'חודש' })
    expect(month).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'שנה' })).toHaveAttribute('tabindex', '-1')
    month.focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByRole('radio', { name: 'שנה' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'שנה' })).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(screen.getByRole('radio', { name: 'הכול' })).toHaveAttribute('aria-checked', 'true')
    await userEvent.keyboard('{Home}')
    expect(month).toHaveAttribute('aria-checked', 'true')
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'הכול' })).toHaveAttribute('aria-checked', 'true')
  })
})

describe('Tabs', () => {
  const tabs = [
    { id: 'one', label: 'ראשון', content: <p>תוכן ראשון</p> },
    { id: 'two', label: 'שני', content: <p>תוכן שני</p> },
  ]

  it('switches panels with the keyboard and keeps aria-selected in sync', async () => {
    render(
      <div dir="rtl">
        <Tabs label="דוגמה" tabs={tabs} />
      </div>,
    )
    expect(screen.getByRole('tab', { name: 'ראשון' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('תוכן ראשון')
    screen.getByRole('tab', { name: 'ראשון' }).focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'שני' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('תוכן שני')
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('שני')
    await userEvent.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'ראשון' })).toHaveFocus()
  })
})

function Opener({ kind }: { kind: 'modal' | 'sheet' | 'confirm' }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>פתיחה</button>
      {open && kind === 'modal' && (
        <Modal title="חלון" onClose={close}>
          <input aria-label="שדה" />
        </Modal>
      )}
      {open && kind === 'sheet' && (
        <Sheet title="עוד" onClose={close}>
          <a href="/about">אודות</a>
        </Sheet>
      )}
      {open && kind === 'confirm' && (
        <ConfirmDialog title="למחוק?" confirmLabel="מחיקה" onConfirm={close} onClose={close}>
          הפעולה אינה הפיכה.
        </ConfirmDialog>
      )}
    </>
  )
}

describe.each(['modal', 'sheet', 'confirm'] as const)('%s', (kind) => {
  it('opens as a dialog, closes with Esc and returns focus to the opener', async () => {
    render(<Opener kind={kind} />)
    const opener = screen.getByRole('button', { name: 'פתיחה' })
    await userEvent.click(opener)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })
})

describe('ConfirmDialog', () => {
  it('focuses "ביטול" first', async () => {
    render(<Opener kind="confirm" />)
    await userEvent.click(screen.getByRole('button', { name: 'פתיחה' }))
    expect(screen.getByRole('button', { name: 'ביטול' })).toHaveFocus()
  })
})

describe('Tooltip', () => {
  it('appears on focus, is linked with aria-describedby and hides on Esc', async () => {
    render(<IconButton label="הוספה" icon="+" tooltip />)
    const button = screen.getByRole('button', { name: 'הוספה' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    act(() => button.focus())
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveTextContent('הוספה')
    expect(button).toHaveAttribute('aria-describedby', tip.id)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('appears on hover', async () => {
    render(
      <Tooltip content="הסבר">
        <button>כפתור</button>
      </Tooltip>,
    )
    await userEvent.hover(screen.getByRole('button'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('הסבר')
  })
})

describe('Toast', () => {
  it('announces with role="status" and disappears', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    const message: ToastMessage = { id: 1, text: 'נשמר', kind: 'success' }
    render(<Toast message={message} onDone={onDone} />)
    expect(screen.getByRole('status')).toHaveTextContent('נשמר')
    act(() => vi.advanceTimersByTime(3000))
    expect(onDone).toHaveBeenCalledOnce()
  })
})

describe('UploadArea', () => {
  const file = (name: string, size: number) => new File([new Uint8Array(size)], name, { type: 'text/csv' })

  it('returns the file chosen with the button', async () => {
    const onFile = vi.fn()
    render(<UploadArea onFile={onFile} accept=".csv" maxSize={1024} />)
    await userEvent.upload(screen.getByLabelText('בחירת קובץ', { selector: 'input' }), file('a.csv', 10))
    expect(onFile).toHaveBeenCalledWith(expect.objectContaining({ name: 'a.csv' }))
  })

  it('accepts a dropped file', () => {
    const onFile = vi.fn()
    render(<UploadArea onFile={onFile} />)
    fireEvent.drop(screen.getByTestId('upload-area'), { dataTransfer: { files: [file('b.csv', 5)] } })
    expect(onFile).toHaveBeenCalledOnce()
  })

  it('rejects a file bigger than maxSize', async () => {
    const onFile = vi.fn()
    render(<UploadArea onFile={onFile} maxSize={1024 * 1024} />)
    await userEvent.upload(screen.getByLabelText('בחירת קובץ', { selector: 'input' }), file('big.csv', 1024 * 1024 + 1))
    expect(onFile).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('הקובץ גדול מדי')
  })

  it('shows progress while processing', () => {
    render(<UploadArea onFile={vi.fn()} progress={40} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40')
    expect(screen.queryByRole('button', { name: 'בחירת קובץ' })).not.toBeInTheDocument()
  })
})

describe('Empty / Error states', () => {
  it('EmptyState shows its title and action', () => {
    render(<EmptyState title="אין הוצאות" description="הוסיפו את הראשונה" action={<Button>הוספה</Button>} />)
    expect(screen.getByRole('heading', { name: 'אין הוצאות' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'הוספה' })).toBeInTheDocument()
  })

  it('ErrorState calls onRetry from "נסו שוב"', async () => {
    const onRetry = vi.fn()
    render(<ErrorState description="אין חיבור" onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('אין חיבור')
    await userEvent.click(screen.getByRole('button', { name: 'נסו שוב' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
