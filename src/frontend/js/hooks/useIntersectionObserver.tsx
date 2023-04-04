import React, { useEffect } from 'react';
import { Nullable } from 'types/utils';

interface UseIntersectionObserverProps {
  root?: React.MutableRefObject<Nullable<Element>>;
  target: React.MutableRefObject<Nullable<Element>>;
  onIntersect: Function;
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

export const useIntersectionObserver = ({
  root,
  target,
  onIntersect,
  threshold = 0.99,
  rootMargin = '0px',
  enabled = true,
}: UseIntersectionObserverProps) => {
  useEffect(() => {
    if (!enabled || !IntersectionObserver) {
      return;
    }

    // eslint-disable-next-line compat/compat
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && onIntersect()),
      {
        root: root?.current,
        rootMargin,
        threshold,
      },
    );

    const el = target?.current;

    if (!el) {
      return;
    }

    observer.observe(el);

    return () => {
      observer.unobserve(el);
    };
  }, [target.current, enabled, onIntersect]);
};
