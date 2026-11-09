import { BarChart3, ExternalLink, FileDown, FileUp, Lock, ShieldCheck, Zap, type LucideIcon } from 'lucide-react'
import { Badge, Card, Chip } from '../ui'
import styles from './AboutPage.module.css'

/** Developer details, exactly as provided by the developer (PRD 4.9). */
export const DEVELOPER = {
  name: 'איתי גולדנברג',
  latinName: 'Itay Goldenberg',
  description:
    'אני מתמקד בלמידה ובפיתוח יישומי Web, בטכנולוגיות Full-Stack ובשילוב כלי AI בתהליכי פיתוח. אני אוהב ליצור אפליקציות המשלבות פונקציונליות, חוויית משתמש אינטואיטיבית ועיצוב מודרני ומוקפד.',
  photo: '/about/itay-goldenberg.jpg',
}

/** Shown only once real links are provided (PRD 4.9). */
export const LINKS: { github: string | null; linkedin: string | null } = { github: null, linkedin: null }

type Feature = { icon: LucideIcon; title: string; text: string; soon?: boolean }

// "soon" marks capabilities of later milestones, so the page never claims what does not exist yet
export const FEATURES: Feature[] = [
  { icon: Lock, title: 'התחברות פרטית', text: 'חשבון אישי עם שם משתמש וסיסמה.', soon: true },
  { icon: Zap, title: 'רישום מהיר', text: 'הוצאה, זיכוי או הכנסה בכמה שניות, מכל מסך.' },
  { icon: FileUp, title: 'ייבוא דוחות', text: 'קובצי בנק ואשראי, עם בדיקה לפני שמירה.', soon: true },
  { icon: BarChart3, title: 'דו"חות וגרפים', text: 'פילוח לפי קטגוריות, מגמות והשוואה בין תקופות.' },
  { icon: FileDown, title: 'ייצוא CSV / PDF', text: 'כל הרישומים או רק המסוננים, בעברית מלאה.' },
  { icon: ShieldCheck, title: 'פרטיות', text: 'כל משתמש רואה רק את הנתונים שלו.', soon: true },
]

/** Only technologies actually used in this project. */
export const TECH_STACK = [
  'React',
  'TypeScript',
  'Vite',
  'React Router',
  'PostgreSQL (Supabase)',
  'Vercel Functions',
  'Chart.js',
  'pdfmake',
  'Papa Parse',
  'Zod',
  'Vitest',
]

export function AboutPage() {
  return (
    <div className={styles.page}>
      <Card level={1} padding="lg" as="section" aria-labelledby="about-hero" className={styles.hero}>
        <div className={`${styles.heroInner} stagger`}>
          <div className={styles.photoWrap}>
            <img className={styles.photo} src={DEVELOPER.photo} alt={`תמונת המפתח: ${DEVELOPER.name}`} width={176} height={176} />
          </div>
          <div className={styles.heroText}>
            <p className={styles.kicker}>אודות</p>
            <h1 id="about-hero" className={styles.name}>
              {DEVELOPER.name} <span className={styles.latin}>— {DEVELOPER.latinName}</span>
            </h1>
            <p className={styles.description}>{DEVELOPER.description}</p>
            {(LINKS.github || LINKS.linkedin) && (
              <div className={styles.links}>
                {LINKS.github && (
                  <a href={LINKS.github} target="_blank" rel="noreferrer" className={styles.link}>
                    <ExternalLink size={18} aria-hidden="true" /> GitHub
                  </a>
                )}
                {LINKS.linkedin && (
                  <a href={LINKS.linkedin} target="_blank" rel="noreferrer" className={styles.link}>
                    <ExternalLink size={18} aria-hidden="true" /> LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card as="section" aria-labelledby="about-app">
        <h2 id="about-app" className={styles.sectionTitle}>
          על האפליקציה
        </h2>
        <p className={styles.paragraph}>
          "ניהול הוצאות" היא אפליקציית Web לניהול הכסף האישי: רישום הוצאות, זיכויים והכנסות, חיפוש וסינון, דו"חות וגרפים,
          וייצוא ל-CSV ול-PDF — בעברית, מהטלפון ומהמחשב.
        </p>
      </Card>

      <section aria-labelledby="about-features" className={styles.section}>
        <h2 id="about-features" className={styles.sectionTitle}>
          יכולות
        </h2>
        <ul className={`${styles.features} stagger`}>
          {FEATURES.map((f) => (
            <li key={f.title}>
              <Card as="article" interactive className={styles.feature}>
                <span className={styles.featureIcon} aria-hidden="true">
                  <f.icon size={22} />
                </span>
                <h3 className={styles.featureTitle}>
                  {f.title}
                  {f.soon && <Badge tone="warning">בקרוב</Badge>}
                </h3>
                <p className={styles.featureText}>{f.text}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <Card as="section" aria-labelledby="about-stack">
        <h2 id="about-stack" className={styles.sectionTitle}>
          Technology Stack
        </h2>
        <ul className={styles.stack} dir="ltr">
          {TECH_STACK.map((t) => (
            <li key={t}>
              <Chip>{t}</Chip>
            </li>
          ))}
        </ul>
      </Card>

      <footer className={styles.footer}>
        <p dir="ltr">Developed by Itay Goldenberg</p>
        <p>פותח בעזרת כלי AI (Claude Code) כחלק מתהליך הפיתוח.</p>
      </footer>
    </div>
  )
}
