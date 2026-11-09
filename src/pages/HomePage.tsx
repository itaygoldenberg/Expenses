import { lazy, Suspense, useMemo, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, CalendarDays, PieChart, Plus, Receipt, Tag, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { formatDisplayDate, todayLocal } from '../../shared/dates'
import { formatAgorotWithSeparators } from '../../shared/money'
import { PageHeader } from '../components/PageHeader'
import { useExpensesData } from '../features/expenses/ExpensesProvider'
import { CategoryTag, KindBadge } from '../features/expenses/ExpenseList'
import { isMoneyIn, signedAmount } from '../features/expenses/displayAmount'
import { computeDashboard, TREND_MONTHS } from '../features/dashboard/dashboardData'
import { Button, Card, CountUp, EmptyState, ErrorState, Skeleton } from '../ui'
import { cx } from '../ui/cx'
import styles from './HomePage.module.css'

const DashboardTrend = lazy(() => import('../features/dashboard/DashboardCharts').then((m) => ({ default: m.DashboardTrend })))
const DashboardDonut = lazy(() => import('../features/dashboard/DashboardCharts').then((m) => ({ default: m.DashboardDonut })))

const shekels = (agorot: number) => `₪${formatAgorotWithSeparators(agorot)}`

function Kpi({ label, icon, children, footer }: { label: string; icon: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <Card as="article" className={styles.kpi}>
      <p className={styles.kpiLabel}>
        <span className={styles.kpiIcon} aria-hidden="true">
          {icon}
        </span>
        {label}
      </p>
      <p className={`num ${styles.kpiValue}`}>{children}</p>
      {footer && <p className={styles.kpiFooter}>{footer}</p>}
    </Card>
  )
}

/** Change vs. last month: up (more spending) in Coral, down in Emerald. */
function Change({ value }: { value: number | null }) {
  if (value === null) return <span className={styles.muted}>אין נתונים להשוואה לחודש הקודם</span>
  const up = value > 0
  const Icon = up ? TrendingUp : TrendingDown
  const text = `${Math.abs(value).toFixed(Math.abs(value) < 10 ? 1 : 0)}%`
  return (
    <span className={cx(styles.change, up ? styles.up : styles.down)}>
      <Icon size={16} aria-hidden="true" />
      <span>
        <span className="num">{text}</span> {up ? 'יותר' : 'פחות'} מהחודש הקודם
      </span>
    </span>
  )
}

/** Home: this month at a glance, from the user's real records only. */
export function HomePage() {
  const { state, reload, openAdd } = useExpensesData()
  const today = todayLocal()
  const expenses = useMemo(() => (state.status === 'ready' ? state.expenses : []), [state])
  const data = useMemo(() => computeDashboard(expenses, today), [expenses, today])

  const addButton = (
    <Button icon={<Plus size={18} aria-hidden="true" />} onClick={openAdd}>
      הוספת הוצאה
    </Button>
  )

  return (
    <div className={styles.page}>
      <PageHeader title="שלום!" subtitle={`הנה מה שקורה ב${data.monthLabel}`} actions={addButton} />

      {state.status === 'loading' && (
        <div className={styles.kpis}>
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i} as="div" className={styles.kpi}>
              <Skeleton lines={2} />
            </Card>
          ))}
        </div>
      )}

      {state.status === 'error' && <ErrorState description="לא הצלחנו לטעון את הנתונים." onRetry={() => void reload()} />}

      {state.status === 'ready' && expenses.length === 0 && (
        <Card level={1} padding="lg">
          <EmptyState
            icon={<Wallet size={44} strokeWidth={1.3} />}
            title="ברוכים הבאים!"
            description="עדיין אין רישומים. הוסיפו את ההוצאה הראשונה, ונציג כאן את סיכום החודש, המגמה והפילוח."
            action={
              <Button icon={<Plus size={18} aria-hidden="true" />} onClick={openAdd}>
                הוספת הוצאה ראשונה
              </Button>
            }
          />
        </Card>
      )}

      {state.status === 'ready' && expenses.length > 0 && (
        <>
          <section aria-label="סיכום החודש">
            <div className={`${styles.kpis} stagger`}>
              <Kpi label="הוצאות החודש (נטו)" icon={<Receipt size={18} />} footer={<Change value={data.change} />}>
                <CountUp value={data.current.netExpenses} format={shekels} />
              </Kpi>
              <Kpi label="הכנסות החודש" icon={<Wallet size={18} />}>
                <CountUp value={data.current.income} format={shekels} />
              </Kpi>
              <Kpi label="רישומים החודש" icon={<CalendarDays size={18} />}>
                <CountUp value={data.current.recordCount} format={String} />
              </Kpi>
              <Kpi label="הקטגוריה הגדולה החודש" icon={<Tag size={18} />}>
                <span className={styles.kpiText}>{data.topCategory ?? '—'}</span>
              </Kpi>
            </div>
          </section>

          <div className={styles.charts}>
            <Card title={`מגמה — ${TREND_MONTHS} חודשים אחרונים`} icon={<TrendingUp size={20} aria-hidden="true" />} className={styles.trend}>
              <Suspense fallback={<Skeleton variant="block" height={240} />}>
                <DashboardTrend points={data.trend} />
              </Suspense>
              <p className={styles.legendNote}>
                <span className={styles.barSwatch} aria-hidden="true" /> הוצאות נטו
                {data.trend.some((p) => p.income > 0) && (
                  <>
                    <span className={styles.lineSwatch} aria-hidden="true" /> הכנסות
                  </>
                )}
              </p>
            </Card>

            <Card title="פילוח החודש" icon={<PieChart size={20} aria-hidden="true" />}>
              {data.categories.length > 0 ? (
                <Suspense fallback={<Skeleton variant="block" height={240} />}>
                  <DashboardDonut data={data.categories} />
                </Suspense>
              ) : (
                <EmptyState title="אין עדיין הוצאות החודש" description="הפילוח יופיע אחרי ההוצאה הראשונה של החודש." />
              )}
            </Card>
          </div>

          <Card title="רישומים אחרונים" icon={<Receipt size={20} aria-hidden="true" />}>
            <ul className={styles.recent}>
              {data.recent.map((e) => (
                <li key={e.id} className={styles.recentItem}>
                  <div className={styles.recentMain}>
                    <span className={styles.recentTitle}>{e.description ?? e.category ?? 'הכנסה'}</span>
                    <span className={styles.recentMeta}>
                      <span className="num">{formatDisplayDate(e.expenseDate)}</span>
                      {e.category && <CategoryTag category={e.category} />}
                      {e.kind !== 'expense' && <KindBadge kind={e.kind} />}
                    </span>
                  </div>
                  <span className={cx('num', styles.recentAmount, isMoneyIn(e) && styles.moneyIn)}>{signedAmount(e)}</span>
                </li>
              ))}
            </ul>
            <Link to="/expenses" className={styles.allLink} viewTransition>
              לכל ההוצאות
              <ArrowLeft size={16} aria-hidden="true" />
            </Link>
          </Card>
        </>
      )}
    </div>
  )
}
