import { useCallback, useMemo, useState, useEffect } from 'react';
import { matchMedia } from 'utils/indirection/window';

/**
 * Hook which listens if a mediaQuery matched.
 * It is useful to show/hide component through a mediaQuery as we do in CSS.
 * e.g: Show a burger menu when we reached mobile width.
 * @param query The media query to monitor
 */
const useMatchMedia = (query: string): boolean => {
  const mediaQuery = useMemo(() => matchMedia(query), [query]);
  const [matches, setMatches] = useState(mediaQuery.matches);
  const handleChange = useCallback((mQuery) => setMatches(mQuery.matches), [setMatches]);

  useEffect(() => {
    mediaQuery.addListener(handleChange);

    return () => {
      mediaQuery.removeListener(handleChange);
    };
  }, [mediaQuery]);

  return matches;
};

export default useMatchMedia;
