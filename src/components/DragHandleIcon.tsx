import styles from './base.module.css'

export const DragHandleIcon = (props: React.ComponentProps<'svg'>) => {
  return (
    <svg className={styles.dragHandleIcon} viewBox="0 0 24 24" {...props}>
      <rect className={styles.dragHandleIconRect} x="3" y="0" width="18" height="24" rx="1.5" />
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  )
}
