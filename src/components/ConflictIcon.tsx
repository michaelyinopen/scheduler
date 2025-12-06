import styles from './base.module.css'

export type ConflictIconProps = {
  className?: string
}

export function ConflictIcon({ className }: ConflictIconProps) {
  const additionalClassName = className !== undefined ? ` ${className}` : ''

  return (
    <svg
      className={styles.conflictIcon + additionalClassName}
      viewBox="0 0 256 256"
    >
      <circle r={100} cx={128} cy={128} stroke="none" />
      <g transform="translate(15.5 15.5) scale(2.5 2.5)">
        <path className={styles.conflictIconExclamationMark} d="M 45 57.469 L 45 57.469 c -1.821 0 -3.319 -1.434 -3.399 -3.252 L 38.465 23.95 c -0.285 -3.802 2.722 -7.044 6.535 -7.044 h 0 c 3.813 0 6.82 3.242 6.535 7.044 l -3.137 30.267 C 48.319 56.036 46.821 57.469 45 57.469 z" />
        <circle className={styles.conflictIconExclamationMark} cx="45" cy="67.67" r="5.42" />
      </g>
    </svg>
  )
}
