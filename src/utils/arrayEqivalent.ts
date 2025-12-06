export function arraysEqual<T>(a: Array<T>, b: Array<T>, comparer: (a: T, b: T) => boolean) {
  if (a === b) return true
  if (a == null || b == null) return false
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; ++i) {
    if (!comparer(a[i], b[i])) {
      return false
    }
  }
  return true
}

export const arraysEqualWithComparer = <T>(comparer: (a: T, b: T) => boolean) => {
  return (a: Array<T>, b: Array<T>) => {
    if (a === b) return true
    if (a == null || b == null) return false
    if (a.length !== b.length) return false

    for (let i = 0; i < a.length; ++i) {
      if (!comparer(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
