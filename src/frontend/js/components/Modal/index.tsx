import { PropsWithChildren, useMemo } from 'react';
import ReactModal from 'react-modal';

export const Modal = ({
  className,
  bodyOpenClassName,
  overlayClassName,
  children,
  ...props
}: PropsWithChildren<ReactModal.Props>) => {
  // As ReactModal can accept a ReactModal.Classes object or a string for some
  // class properties, we have to impletemente a little util to merge this special
  // object with the default CSS class to applied.
  const mergeClasses = ({ base, classes }: { base?: string; classes?: any }) => {
    if (base && classes) {
      if (typeof classes === 'object') {
        return {
          ...classes,
          base: base.concat(' ', classes.base),
        };
      }
      if (typeof classes === 'string' && classes.trim()) {
        return base.concat(' ', classes);
      }
    }

    return base || classes || undefined;
  };

  const modalExclude = useMemo(() => {
    const exclude = document.getElementById('modal-exclude');
    if (exclude) {
      return exclude;
    }
    throw new Error('Failed to get #modal-exclude to enable an accessible <ReactModal />.');
  }, []);

  return (
    <ReactModal
      appElement={modalExclude}
      className={mergeClasses({ base: 'modal', classes: className })}
      bodyOpenClassName={mergeClasses({ base: 'has-opened-modal', classes: bodyOpenClassName })}
      overlayClassName={mergeClasses({ base: 'modal__overlay', classes: overlayClassName })}
      {...props}
    >
      {children}
    </ReactModal>
  );
};
