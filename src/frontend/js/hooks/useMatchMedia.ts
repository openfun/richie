import { useCallback, useEffect, useMemo, useState } from 'react';
import { matchMedia } from 'utils/indirection/window';
import { tokens } from 'utils/cunningham-tokens';

/**
 * Hook which listens if a mediaQuery matched.
 * It is useful to show/hide component through a mediaQuery as we do in CSS.
 * e.g: Show a burger menu when we reached mobile width.
 * @param query The media query to monitor
 */
const useMatchMedia = (query: string): boolean => {
  const mediaQuery = useMemo(() => matchMedia(query), [query]);
  const [matches, setMatches] = useState(mediaQuery.matches);
  const handleChange = useCallback(
    (mQuery: MediaQueryListEvent) => setMatches(mQuery.matches),
    [setMatches],
  );

  useEffect(() => {
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [mediaQuery]);

  return matches;
};

export const useMatchMediaLg = () =>
  useMatchMedia(`(max-width: ${tokens.themes.default.theme.breakpoints.lg})`);

export default useMatchMedia;
