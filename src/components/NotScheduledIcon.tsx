import styles from './base.module.css'

export function NotScheduledIcon() {
  return (
    <svg
      className={styles.notCompletedIcon}
      viewBox='-120 -120 240 240'
    >
      <circle r={92} strokeWidth={16} />
    </svg>
  )
}
