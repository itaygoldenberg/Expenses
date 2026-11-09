import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CreditCard, Plus, Search, Settings, Trash2, Wallet } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  DataTable,
  EmptyState,
  ErrorState,
  IconButton,
  Modal,
  PasswordField,
  SegmentedControl,
  SelectField,
  Sheet,
  Skeleton,
  Tabs,
  TextField,
  Toast,
  Tooltip,
  UploadArea,
  type Column,
  type SortDirection,
  type ToastMessage,
} from '../ui'
import { contrastRatio, FILLED_PAIRS, MIN_TEXT_CONTRAST, SURFACES, TEXT_COLORS } from '../ui/contrast'
import styles from './DesignSystemPage.module.css'

/** Demo rows — clearly sample data, not user data. */
type DemoRow = { id: string; name: string; category: string; amount: number; date: string }
const DEMO_ROWS: DemoRow[] = [
  { id: '1', name: 'דוגמה: סופרמרקט', category: 'מזון', amount: 248.9, date: '2026-11-02' },
  { id: '2', name: 'דוגמה: דלק', category: 'תחבורה', amount: 310, date: '2026-11-05' },
  { id: '3', name: 'דוגמה: מנוי סטרימינג', category: 'בילויים', amount: 39.9, date: '2026-10-28' },
]

function useHtmlFlag(name: 'data-reduce-motion' | 'data-reduce-transparency' | 'data-simulate-no-blur') {
  const [on, setOn] = useState(() => document.documentElement.getAttribute(name) === 'true')
  useEffect(() => {
    const root = document.documentElement
    if (on) root.setAttribute(name, 'true')
    else root.removeAttribute(name)
  }, [name, on])
  // Leave the page clean when navigating away
  useEffect(() => () => document.documentElement.removeAttribute(name), [name])
  return [on, setOn] as const
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={styles.switch}>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={styles.track} aria-hidden="true" />
      {label}
    </label>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card title={title} as="section" className={styles.section}>
      {children}
    </Card>
  )
}

export function DesignSystemPage() {
  const [reduceMotion, setReduceMotion] = useHtmlFlag('data-reduce-motion')
  const [reduceTransparency, setReduceTransparency] = useHtmlFlag('data-reduce-transparency')
  const [noBlur, setNoBlur] = useHtmlFlag('data-simulate-no-blur')

  const [period, setPeriod] = useState<'month' | 'year' | 'all'>('month')
  const [open, setOpen] = useState<'modal' | 'confirm' | 'sheet' | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const toastId = useRef(0)
  const [chips, setChips] = useState(['מזון', 'תחבורה', 'נובמבר 2026'])
  const [sort, setSort] = useState<{ key: string; direction: SortDirection }>({ key: 'date', direction: 'desc' })
  const [progress, setProgress] = useState<number | undefined>(undefined)
  const [chosen, setChosen] = useState('')

  function showToast(kind: ToastMessage['kind']) {
    toastId.current += 1
    const text = { success: 'נשמר בהצלחה', error: 'השמירה נכשלה', info: 'הקובץ מעובד ברקע' }[kind]
    setToast({ id: toastId.current, text, kind })
  }

  // Fake processing bar for the upload demo
  useEffect(() => {
    if (progress === undefined) return
    if (progress >= 100) {
      const done = setTimeout(() => setProgress(undefined), 400)
      return () => clearTimeout(done)
    }
    const t = setTimeout(() => setProgress((p) => (p ?? 0) + 20), 300)
    return () => clearTimeout(t)
  }, [progress])

  const columns: Column<DemoRow>[] = [
    { key: 'name', header: 'תיאור', render: (r) => r.name, sortable: true },
    { key: 'category', header: 'קטגוריה', render: (r) => <Badge tone="accent">{r.category}</Badge> },
    { key: 'date', header: 'תאריך', render: (r) => r.date.split('-').reverse().join('/'), numeric: true, sortable: true },
    { key: 'amount', header: 'סכום', render: (r) => `₪${r.amount.toFixed(2)}`, numeric: true, sortable: true },
  ]

  const rows = useMemo(() => {
    const dir = sort.direction === 'asc' ? 1 : -1
    return [...DEMO_ROWS].sort((a, b) => {
      const av = a[sort.key as keyof DemoRow]
      const bv = b[sort.key as keyof DemoRow]
      return (av < bv ? -1 : av > bv ? 1 : 0) * dir
    })
  }, [sort])

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <h1>רכיבים</h1>
        <p className={styles.muted}>דף פנימי לבדיקה — זמין רק בהרצה מקומית. הנתונים כאן הם דוגמה בלבד.</p>
      </header>

      <Section title="פאנל בקרה">
        <div className={styles.switches}>
          <Switch label="הפחתת תנועה" checked={reduceMotion} onChange={setReduceMotion} />
          <Switch label="הפחתת שקיפות" checked={reduceTransparency} onChange={setReduceTransparency} />
          <Switch label="דמיית דפדפן בלי טשטוש" checked={noBlur} onChange={setNoBlur} />
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.contrast}>
            <caption className={styles.caption}>ניגודיות (מינימום {MIN_TEXT_CONTRAST}:1)</caption>
            <thead>
              <tr>
                <th scope="col">טקסט</th>
                {SURFACES.map((s) => (
                  <th key={s.name} scope="col">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TEXT_COLORS.map((t) => (
                <tr key={t.name}>
                  <th scope="row" style={{ color: t.hex }}>
                    {t.name}
                  </th>
                  {SURFACES.map((s) => {
                    const ratio = contrastRatio(t.hex, s.rgb)
                    return (
                      <td key={s.name} style={{ background: `rgb(${s.rgb.join(' ')})`, color: t.hex }} className="num">
                        {ratio.toFixed(1)}
                        {ratio < MIN_TEXT_CONTRAST && ' ✗'}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {FILLED_PAIRS.map((p) => (
                <tr key={p.name}>
                  <th scope="row">{p.name}</th>
                  <td colSpan={SURFACES.length} style={{ background: p.bg, color: p.fg }} className="num">
                    {contrastRatio(p.fg, p.bg).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="כפתורים">
        <div className={styles.row}>
          <Button icon={<Plus size={18} aria-hidden="true" />}>ראשי</Button>
          <Button variant="secondary">משני</Button>
          <Button variant="ghost">שקוף</Button>
          <Button variant="danger" icon={<Trash2 size={18} aria-hidden="true" />}>
            מחיקה
          </Button>
          <Button disabled>מושבת</Button>
          <Button loading>שומר…</Button>
          <Button size="sm" variant="secondary">
            קטן
          </Button>
        </div>
        <div className={styles.row}>
          <IconButton label="הגדרות" icon={<Settings size={20} aria-hidden="true" />} tooltip />
          <IconButton label="חיפוש" icon={<Search size={20} aria-hidden="true" />} variant="ghost" tooltip />
          <Tooltip content="הסבר קצר שמופיע גם בפוקוס">
            <Button variant="secondary" size="sm">
              עם Tooltip
            </Button>
          </Tooltip>
        </div>
      </Section>

      <Section title="שדות">
        <div className={styles.grid}>
          <TextField label="תיאור" placeholder="למשל: קניות בסופר" hint="עד 200 תווים" />
          <TextField label="סכום" numeric startAdornment="₪" placeholder="0.00" />
          <TextField label="שדה עם שגיאה" defaultValue="abc" error="יש להזין סכום חיובי" />
          <TextField label="מושבת" disabled defaultValue="לא ניתן לעריכה" />
          <PasswordField label="סיסמה" autoComplete="new-password" />
          <SelectField
            label="קטגוריה"
            placeholder="בחרו קטגוריה"
            options={['מזון', 'תחבורה', 'בילויים'].map((c) => ({ value: c, label: c }))}
            value={chosen}
            onChange={(e) => setChosen(e.target.value)}
          />
        </div>
      </Section>

      <Section title="בחירה וטאבים">
        <div className={styles.stack}>
          <SegmentedControl
            label="תקופה"
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'month', label: 'חודש' },
              { value: 'year', label: 'שנה' },
              { value: 'all', label: 'הכול' },
            ]}
          />
          <Tabs
            label="דוגמת טאבים"
            tabs={[
              { id: 'summary', label: 'סיכום', content: <p className={styles.muted}>תוכן הטאב "סיכום".</p> },
              { id: 'categories', label: 'קטגוריות', content: <p className={styles.muted}>תוכן הטאב "קטגוריות".</p> },
              { id: 'trend', label: 'מגמה', content: <p className={styles.muted}>תוכן הטאב "מגמה".</p> },
            ]}
          />
        </div>
      </Section>

      <Section title="כרטיסים">
        <div className={styles.cards}>
          <Card level={1} title="רמה 1" icon={<Wallet size={20} aria-hidden="true" />}>
            <p className={styles.muted}>כרטיס רגיל — רוב התוכן.</p>
          </Card>
          <Card level={2} title="רמה 2" icon={<CreditCard size={20} aria-hidden="true" />}>
            <p className={styles.muted}>זכוכית חזקה יותר — חלונות ותפריטים.</p>
          </Card>
          <Card level={3} title="רמה 3" interactive tabIndex={0}>
            <p className={styles.muted}>זכוכית כהה — Tooltip ו-Toast. עם Hover.</p>
          </Card>
        </div>
      </Section>

      <Section title="טבלה">
        <DataTable
          caption="טבלת דוגמה"
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          sort={sort}
          onSort={(key) =>
            setSort((s) => ({ key, direction: s.key === key && s.direction === 'desc' ? 'asc' : 'desc' }))
          }
        />
      </Section>

      <Section title="תגיות">
        <div className={styles.row}>
          <Badge>רגיל</Badge>
          <Badge tone="positive" dot>
            הכנסה
          </Badge>
          <Badge tone="negative" dot>
            הוצאה
          </Badge>
          <Badge tone="warning">כפילות אפשרית</Badge>
          <Badge tone="accent">זיכוי</Badge>
        </div>
        <div className={styles.row}>
          {chips.map((c) => (
            <Chip key={c} onRemove={() => setChips((all) => all.filter((x) => x !== c))} removeLabel={`הסרת ${c}`}>
              {c}
            </Chip>
          ))}
          {chips.length === 0 && (
            <Button size="sm" variant="ghost" onClick={() => setChips(['מזון', 'תחבורה', 'נובמבר 2026'])}>
              החזרת הצ׳יפים
            </Button>
          )}
        </div>
      </Section>

      <Section title="חלונות והודעות">
        <div className={styles.row}>
          <Button variant="secondary" onClick={() => setOpen('modal')}>
            Modal
          </Button>
          <Button variant="secondary" onClick={() => setOpen('confirm')}>
            ConfirmDialog
          </Button>
          <Button variant="secondary" onClick={() => setOpen('sheet')}>
            Sheet
          </Button>
          <Button variant="secondary" onClick={() => showToast('success')}>
            Toast הצלחה
          </Button>
          <Button variant="secondary" onClick={() => showToast('error')}>
            Toast שגיאה
          </Button>
          <Button variant="secondary" onClick={() => showToast('info')}>
            Toast מידע
          </Button>
        </div>
      </Section>

      <Section title="מצבים">
        <div className={styles.cards}>
          <div className={styles.stack}>
            <Skeleton variant="circle" />
            <Skeleton lines={3} />
            <Skeleton variant="block" />
          </div>
          <EmptyState
            title="אין עדיין הוצאות"
            description="הוסיפו את ההוצאה הראשונה כדי לראות כאן נתונים."
            action={<Button size="sm">הוספת הוצאה</Button>}
          />
          <ErrorState description="לא הצלחנו לטעון את הנתונים. בדקו את החיבור לאינטרנט." onRetry={() => showToast('info')} />
        </div>
      </Section>

      <Section title="העלאת קובץ">
        <div className={styles.cards}>
          <UploadArea
            accept=".csv,.xlsx,.pdf"
            maxSize={5 * 1024 * 1024}
            description="CSV, Excel או PDF, עד 5MB"
            progress={progress}
            onFile={(file) => {
              setToast({ id: ++toastId.current, text: `נבחר: ${file.name}`, kind: 'info' })
              setProgress(0)
            }}
          />
          <UploadArea onFile={() => {}} error="לא הצלחנו לקרוא את הקובץ. נסו קובץ אחר." description="דוגמה למצב שגיאה" />
        </div>
      </Section>

      {open === 'modal' && (
        <Modal title="חלון לדוגמה" onClose={() => setOpen(null)}>
          <div className={styles.stack}>
            <TextField label="שם" />
            <Button onClick={() => setOpen(null)}>סגירה</Button>
          </div>
        </Modal>
      )}
      {open === 'confirm' && (
        <ConfirmDialog
          title="למחוק את ההוצאה?"
          confirmLabel="מחיקה"
          onConfirm={() => {
            setOpen(null)
            showToast('success')
          }}
          onClose={() => setOpen(null)}
        >
          הפעולה אינה הפיכה.
        </ConfirmDialog>
      )}
      {open === 'sheet' && (
        <Sheet title="Sheet לדוגמה" onClose={() => setOpen(null)}>
          <p className={styles.muted}>בטלפון החלון עולה מלמטה; במחשב הוא מופיע במרכז.</p>
        </Sheet>
      )}
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  )
}
