import styles from './base.module.css'

export type PlusIconProps = {
  className?: string
}

export function PlusIcon({ className }: PlusIconProps) {
  return (
    <svg
      className={styles.plusIcon + (className ? ` ${className}` : '')}
      viewBox='-120 -120 240 240'
    >
      <circle r={100} stroke="none" />
      <line className={styles.plusIconSign} x1="-50" y1="0" x2="50" y2="0" />
      <line className={styles.plusIconSign} x1="0" y1="-50" x2="0" y2="50" />
    </svg>
  )
}
