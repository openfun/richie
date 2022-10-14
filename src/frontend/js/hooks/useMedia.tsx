import { useMediaQuery } from 'react-responsive';

export enum MediaQueryBreakpoints {
  XS = 0,
  SM = 576,
  MD = 768,
  LG = 992,
  XL = 1200,
  XXL = 1900,
}

export function useMediaQuerySM() {
  return useMediaQuery({ query: '(max-width: ' + MediaQueryBreakpoints.MD + 'px)' });
}
