import { useEffect, useRef } from 'react';

/**
 * Hook which stores the previous value of a component prop or state.
 * https://usehooks.com/usePrevious/
 *
 * @param value
 */
const usePrevious = <T>(value: T): T => {
  const previous = useRef<T>(value);

  useEffect(() => {
    previous.current = value;
  }, [value]);

  return previous.current;
};

export default usePrevious;
