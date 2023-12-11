import { MouseEvent, useRef } from 'react';
import { useHref, useNavigate } from 'react-router-dom';
import { Button, ButtonProps } from '@openfun/cunningham-react';
import { location } from 'utils/indirection/window';
import isTestEnv from 'utils/test/isTestEnv';

export const RouterButton = (props: ButtonProps) => {
  if (!props.href) {
    throw new Error("The attribute 'href' is required when using RouterButton.");
  }
  const hrefBase = useHref('');
  const navigate = useNavigate();
  const ref = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  return (
    <Button
      className={props.className}
      ref={ref}
      href={hrefBase + props.href}
      onClick={(event: MouseEvent) => {
        if (props.href?.match('^http')) {
          // We must do this to be able to tests redirects.
          if (isTestEnv) {
            location.replace(props.href);
          }
          return;
        }
        event.preventDefault();
        navigate(props.href!);
        ref.current?.blur();
      }}
      {...props}
    />
  );
};
