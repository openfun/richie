import {
  Alert,
  Button,
  DataGrid,
  DataList,
  Input,
  Modal,
  ModalProps,
  ModalSize,
  Select,
  VariantType,
} from '@openfun/cunningham-react';
import { ProductPath } from 'components/SaleTunnelV2/ProductPath';
import { CreditCardBrand, Product } from 'types/Joanie';
import { SaleTunnelSponsors } from 'components/SaleTunnelV2/SaleTunnelSponsors';
import { CreditCardBrandLogo } from 'pages/DashboardCreditCardsManagement/CreditCardBrandLogo';
import { CreditCardFactory } from 'utils/test/factories/joanie';
import { PaymentScheduleGrid } from 'components/PaymentScheduleGrid';
import { AddressSelector } from 'components/SaleTunnelV2/AddressSelector';

interface SaleTunnelV2Props extends Pick<ModalProps, 'isOpen' | 'onClose'> {
  product: Product;
}

export const SaleTunnelV2 = (props: SaleTunnelV2Props) => {
  return (
    <Modal {...props} size={ModalSize.EXTRA_LARGE} title="e-enable clicks-and-mortar supply-chains">
      <div className="sale-tunnel">
        <div className="sale-tunnel__main">
          <div className="sale-tunnel__main__left">
            <ProductPath product={props.product} /> {/* <- Slot */}
          </div>
          <div className="sale-tunnel__main__separator" />
          <div className="sale-tunnel__main__right">
            <SaleTunnelInformation />
          </div>
        </div>
        <div className="sale-tunnel__footer">
          <Button>Sign contract</Button> {/* <- Slot */}
          <SaleTunnelSponsors />
        </div>
      </div>
    </Modal>
  );
};

const SaleTunnelInformation = () => {
  return (
    <div className="sale-tunnel__information">
      <div>
        <h3 className="block-title mb-t">Informations</h3>
        <div className="description mb-s">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sollicitudin elementum.
        </div>
        <Input label="Full name" fullWidth={true} />
        <AddressSelector />
      </div>
      <div>
        <CreditCardSelector />
      </div>
      <div>
        <PaymentScheduleBlock />
      </div>
    </div>
  );
};

const CreditCardSelector = () => {
  return (
    <div className="credit-card-selector">
      <h4 className="block-title mb-t">Payment method</h4>
      <div className="description mb-s">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sollicitudin elementum.
      </div>
      <div className="credit-card-selector__card">
        <CreditCardBrandLogo
          creditCard={{ ...CreditCardFactory().one(), brand: CreditCardBrand.MASTERCARD }}
          variant="inline"
        />
        <div className="credit-card-selector__card__info">
          <div className="credit-card-selector__card__info__title">Title</div>
          <div className="credit-card-selector__card__info__meta">
            <div>Ends with •••• 9821</div>
            <div>|</div>
            <div>Expires on 02/2032</div>
          </div>
        </div>
        <Button
          icon={<span className="material-icons">edit</span>}
          color="tertiary-text"
          size="medium"
        />
      </div>
    </div>
  );
};

const PaymentScheduleBlock = () => {
  return (
    <div className="payment-schedule">
      <h4 className="block-title mb-t">Schedule</h4>
      <Alert type={VariantType.INFO}>
        The first payment occurs in 14 days, you will be notified to pay the first 30%.
      </Alert>
      <div className="mt-t">
        <PaymentScheduleGrid />
      </div>
    </div>
  );
};
