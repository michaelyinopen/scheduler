function areInputsEqual(
  newInputs: unknown[],
  lastInputs: unknown[],
): boolean {
  // no checks needed if the inputs length has changed
  if (newInputs.length !== lastInputs.length) {
    return false;
  }
  // Using for loop for speed. It generally performs better than array.every
  for (let i = 0; i < newInputs.length; i++) {
    if (!Object.is(newInputs[i], lastInputs[i])) {
      return false;
    }
  }
  return true;
}

export type EqualityFn<TFunc extends (...args: any[]) => any> = (
  newArgs: Parameters<TFunc>,
  lastArgs: Parameters<TFunc>,
) => boolean

export type MemoizedFn<TFunc extends (...args: any[]) => any> = {
  clear: () => void
  (...args: Parameters<TFunc>): ReturnType<TFunc>
}

type Cache<TFunc extends (this: any, ...args: any[]) => any> = {
  lastArgs: Parameters<TFunc>
  lastResult: ReturnType<TFunc>
}

export function memoizeOne<TFunc extends (...newArgs: any[]) => any>(
  resultFn: TFunc,
  isEqual: EqualityFn<TFunc> = areInputsEqual,
): MemoizedFn<TFunc> {
  let cache: Cache<TFunc> | null = null

  function memoized(
    ...newArgs: Parameters<TFunc>
  ): ReturnType<TFunc> {
    if (cache && isEqual(newArgs, cache.lastArgs)) {
      return cache.lastResult
    }

    const lastResult = resultFn(...newArgs)
    cache = {
      lastResult,
      lastArgs: newArgs,
    }

    return lastResult;
  }

  // Adding the ability to clear the cache of a memoized function
  memoized.clear = function clear() {
    cache = null
  }

  return memoized
}
