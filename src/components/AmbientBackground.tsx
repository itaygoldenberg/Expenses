import styles from './AmbientBackground.module.css'

/** Fixed background: Midnight → Navy gradient with three slow, soft light blobs (transform only). */
export function AmbientBackground() {
  return (
    <div className={styles.ambient} aria-hidden="true">
      <span className={`${styles.blob} ${styles.blue}`} />
      <span className={`${styles.blob} ${styles.cyan}`} />
      <span className={`${styles.blob} ${styles.emerald}`} />
    </div>
  )
}
