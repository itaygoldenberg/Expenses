import { Info, UserRound } from 'lucide-react'
import homeStyles from './HomePage.module.css'
import styles from './AboutPage.module.css'

/**
 * Developer details for the "about the developer" section.
 * Filled only from details the user actually provided (PRD 4.7, MILESTONES M5).
 * null = not provided yet → a clearly marked placeholder is shown.
 */
export const DEVELOPER: { name: string; description: string; photo: string } | null = {
  name: 'איתי גולדנברג',
  description:
    'אני מתמקד בלמידה ובפיתוח יישומי Web, בטכנולוגיות Full-Stack ובשילוב כלי AI בתהליכי פיתוח. אני אוהב ליצור אפליקציות המשלבות פונקציונליות, חוויית משתמש אינטואיטיבית ועיצוב מודרני ומוקפד.',
  photo: '/about/itay-goldenberg.jpg',
}

export function AboutPage() {
  return (
    <div className={homeStyles.page}>
      <section className={homeStyles.card} aria-labelledby="about-system">
        <h1 id="about-system" className={homeStyles.title}>
          <Info size={24} aria-hidden="true" className={homeStyles.titleIcon} />
          אודות המערכת
        </h1>
        <div className={styles.box}>
          <h2 className={styles.boxTitle}>מערכת לניהול הוצאות אישיות</h2>
          <p>הוספה, עדכון ומחיקה של הוצאות.</p>
          <p>סינון לפי תאריך וסכום, הצגת דו"חות וייצוא ל-CSV ול-PDF.</p>
        </div>
      </section>

      <section className={homeStyles.card} aria-labelledby="about-developer">
        <h2 id="about-developer" className={homeStyles.title}>
          <UserRound size={22} aria-hidden="true" className={homeStyles.titleIcon} />
          אודות המפתח/ת
        </h2>
        <div className={styles.developer}>
          <div className={`${styles.box} ${styles.details}`}>
            <h3 className={styles.boxTitle}>{DEVELOPER ? DEVELOPER.name : 'פרטי המפתח/ת'}</h3>
            <p className={DEVELOPER ? undefined : styles.placeholder}>
              {DEVELOPER ? DEVELOPER.description : 'פרטי המפתח/ת יתווספו בהמשך.'}
            </p>
          </div>
          <figure className={`${styles.box} ${styles.photoBox}`}>
            {DEVELOPER ? (
              <img className={styles.photo} src={DEVELOPER.photo} alt={`תמונת המפתח: ${DEVELOPER.name}`} />
            ) : (
              <div className={styles.photoPlaceholder} aria-hidden="true">
                <UserRound size={64} />
              </div>
            )}
            <figcaption className={styles.caption}>{DEVELOPER ? DEVELOPER.name : 'תמונה תתווסף בהמשך'}</figcaption>
          </figure>
        </div>
      </section>
    </div>
  )
}
