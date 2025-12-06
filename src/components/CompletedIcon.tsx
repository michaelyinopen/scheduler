import styles from './base.module.css'

export type CompletedIconProps = {
  className?: string
}

export function CompletedIcon({ className }: CompletedIconProps) {
  return (
    <svg
      className={styles.completedIcon + (className ? ` ${className}` : '')}
      viewBox='-120 -120 240 240'
    >
      <circle r={100} stroke="none" />
      <path
        className={styles.completedIconCheckMark}
        d="M-64 0 L-24 40 L64 -48"
        fill="none"
      />
    </svg>
  )
}
