import { useSelect } from 'downshift';
import { useMemo, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Spinner } from 'components/Spinner';
import { useJoanieApi } from 'data/JoanieApiProvider';
import type * as Joanie from 'types/Joanie';
import { handle } from 'utils/errors/handle';

enum MenuItemKey {
  DOWNLOAD_INVOICE = 'downloadInvoice',
}

const messages = defineMessages({
  actionsRelated: {
    defaultMessage: 'Other actions related to this product',
    description: 'Accessible label for the purchased product menu',
    id: 'components.PurchasedProductMenu.actionsRelated',
  },
  generatingInvoice: {
    defaultMessage: 'Invoice is being generated...',
    description: 'Accessible label when invoice is being generated',
    id: 'components.PurchasedProductMenu.generatingInvoice',
  },
  [MenuItemKey.DOWNLOAD_INVOICE]: {
    defaultMessage: 'Download invoice',
    description: 'Label for selector item to download invoice',
    id: 'components.PurchasedProductMenu.downloadInvoice',
  },
});

interface Props {
  order: Joanie.OrderLite;
}

const PurchasedProductMenu = ({ order }: Props) => {
  const API = useJoanieApi();
  const [loading, setLoading] = useState(false);

  const downloadInvoice = async () => {
    try {
      setLoading(true);
      const $link = document.createElement('a');
      const file = await API.user.orders.invoice.download({
        order_id: order.id,
        invoice_reference: order.main_invoice,
      });
      // eslint-disable-next-line compat/compat
      const url = URL.createObjectURL(file);
      $link.href = url;
      $link.download = '';

      const revokeObject = () => {
        // eslint-disable-next-line compat/compat
        URL.revokeObjectURL(url);
        window.removeEventListener('blur', revokeObject);
      };

      window.addEventListener('blur', revokeObject);
      $link.click();
    } catch (error) {
      handle(error);
    } finally {
      setLoading(false);
    }
  };

  const items = [
    {
      key: MenuItemKey.DOWNLOAD_INVOICE,
      action: downloadInvoice,
    },
  ];

  const {
    isOpen,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    highlightedIndex,
    getItemProps,
  } = useSelect({ items });

  const selectorListClasses = useMemo(() => {
    const classList = ['selector__list'];

    if (!isOpen) {
      classList.push('selector__list--is-closed');
    }

    return classList.join(' ');
  }, [loading, isOpen]);

  const selectorItemClasses = (index: Number) => {
    const classList = ['selector__list__link'];

    if (highlightedIndex === index) {
      classList.push('selector__list__link--highlighted');
    }

    return classList.join(' ');
  };

  return (
    <nav className="selector">
      <label {...getLabelProps()} className="offscreen">
        <FormattedMessage {...messages.actionsRelated} />
      </label>
      <button {...getToggleButtonProps()} disabled={loading} className="selector__button">
        {loading ? (
          <Spinner theme="light" aria-labelledby="generating-invoice">
            <span id="generating-invoice">
              <FormattedMessage {...messages.generatingInvoice} />
            </span>
          </Spinner>
        ) : (
          <svg role="img" className="selector__button__icon" aria-hidden>
            <use href="#icon-three-vertical-dots" />
          </svg>
        )}
      </button>
      <ul {...getMenuProps()} className={selectorListClasses}>
        {isOpen &&
          items.map((item, index) => (
            <li key={item.key} {...getItemProps({ item, index })}>
              <button className={selectorItemClasses(index)} onClick={item.action}>
                <FormattedMessage {...messages[item.key]} />
              </button>
            </li>
          ))}
      </ul>
    </nav>
  );
};

export default PurchasedProductMenu;
