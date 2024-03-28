import { Alert, Button, Modal, ModalProps, ModalSize } from '@openfun/cunningham-react';
import { ProductPath } from 'components/SaleTunnelV2/ProductPath';
import { Product } from 'types/Joanie';

interface SaleTunnelV2Props extends Pick<ModalProps, 'isOpen' | 'onClose'> {
  product: Product;
}

export const SaleTunnelV2 = (props: SaleTunnelV2Props) => {
  return (
    <Modal {...props} size={ModalSize.LARGE} title="e-enable clicks-and-mortar supply-chains">
      <div className="sale-tunnel">
        <div className="sale-tunnel__main">
          <div className="sale-tunnel__main__left">
            <ProductPath product={props.product} /> {/* <- Slot */}
          </div>
          <div className="sale-tunnel__main__separator" />
          <div className="sale-tunnel__main__right" />
        </div>
        <div className="sale-tunnel__footer">
          <Button>Sign contract</Button> {/* <- Slot */}
          {/* Make this a component */}
          <div className="sale-tunnel__footer__sponsors">
            {/* <- Slot */}
            <img
              src="https://www.universite-paris-saclay.fr/sites/default/files/media/2019-12/logo-ups.svg"
              alt="Sponsor"
            />
            <img
              src="https://u-paris.fr/wp-content/uploads/2022/03/Universite_Paris-Cite-logo.jpeg"
              alt="Sponsor"
            />
            <img
              src="https://ecocampus.fr/wp-content/uploads/2019/12/Logo-Cnam.jpg"
              alt="Sponsor"
            />
            <img
              src="https://www.univ-toulouse.fr/sites/default/files/Universite-de-Toulouse_0.jpg"
              alt="Sponsor"
            />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Universit%C3%A4t_Bordeaux_Logo.svg/2560px-Universit%C3%A4t_Bordeaux_Logo.svg.png"
              alt="Sponsor"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
