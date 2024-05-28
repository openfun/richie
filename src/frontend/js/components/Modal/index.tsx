import { ReactNode, useMemo } from 'react';
import ReactModal from 'react-modal';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import { StringHelper } from 'utils/StringHelper';
import { Icon, IconTypeEnum } from 'components/Icon';

const messages = defineMessages({
  closeDialog: {
    defaultMessage: 'Close dialog',
    description: 'Text for the button to close the modal',
    id: 'components.Modal.closeDialog',
  },
});

interface ModalProps extends ReactModal.Props {
  hasCloseButton?: boolean;
  title?: string | ReactNode;
}

export const Modal = ({
  className,
  bodyOpenClassName,
  overlayClassName,
  children,
  hasCloseButton = true,
  title,
  ...props
}: ModalProps) => {
  const intl = useIntl();

  // As ReactModal can accept a ReactModal.Classes object or a string for some
  // class properties, we have to implement a little util to merge this special
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
    headerClasses.push('modal__header--filled');
  }

  return (
    <ReactModal
      appElement={modalExclude}
      className={mergeClasses({ base: 'modal', classes: className })}
      bodyOpenClassName={mergeClasses({ base: 'has-opened-modal', classes: bodyOpenClassName })}
      overlayClassName={mergeClasses({ base: 'modal__overlay', classes: overlayClassName })}
      {...props}
    >
      <header className={headerClasses.join(' ')}>
        {StringHelper.isString(title) && <h2>{title}</h2>}
        {!StringHelper.isString(title) && title}
        {hasCloseButton && (
          <Button
            aria-label={intl.formatMessage(messages.closeDialog)}
            className="modal__closeButton"
            onClick={(e) => props.onRequestClose?.(e)}
            title={intl.formatMessage(messages.closeDialog)}
            color="tertiary"
            size="small"
          >
            <Icon name={IconTypeEnum.ROUND_CLOSE} />
            <span className="offscreen">
              <FormattedMessage {...messages.closeDialog} />
            </span>
          </Button>
        )}
      </header>
      {children}
    </ReactModal>
  );
};
