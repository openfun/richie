import { ReactNode, useMemo } from 'react';
import ReactModal from 'react-modal';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

const messages = defineMessages({
  closeDialog: {
    defaultMessage: 'Close modal',
    description: 'Text for the button to close the modal',
    id: 'components.Modal.closeDialog',
  },
});

interface ModalProps extends ReactModal.Props {
  closeButton?: boolean;
  title?: string | ReactNode;
}

export const Modal = ({
  className,
  bodyOpenClassName,
  overlayClassName,
  children,
  closeButton = true,
  title,
  ...props
}: ModalProps) => {
  const intl = useIntl();

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

  const headerClasses = ['modal__header'];
  if (title) {
    headerClasses.push('filled');
  }

  return (
    <ReactModal
      appElement={modalExclude}
      className={mergeClasses({ base: 'modal', classes: className })}
      bodyOpenClassName={mergeClasses({ base: 'has-opened-modal', classes: bodyOpenClassName })}
      overlayClassName={mergeClasses({ base: 'modal__overlay', classes: overlayClassName })}
      {...props}
    >
      <div className={headerClasses.join(' ')}>
        <div>{title}</div>
        {closeButton && (
          <button
            className="modal__closeButton"
            onClick={(e) => props.onRequestClose?.(e)}
            title={intl.formatMessage(messages.closeDialog)}
          >
            <svg className="modal__closeButton__icon" aria-hidden="true">
              <use href="#icon-round-close" />
            </svg>
            <span className="offscreen">
              <FormattedMessage {...messages.closeDialog} />
            </span>
          </button>
        )}
      </div>
      {children}
    </ReactModal>
  );
};
