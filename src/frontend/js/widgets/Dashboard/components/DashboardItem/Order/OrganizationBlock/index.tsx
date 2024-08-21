import { defineMessages, FormattedMessage } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import { CredentialOrder, Product } from 'types/Joanie';
import { AddressView } from 'components/Address';
import ContractItem from '../ContractItem';
import Installment from '../Installment';

const messages = defineMessages({
  contactDescription: {
    id: 'components.DashboardItemOrder.OrganizationBlock.contactDescription',
    description: 'Description of the contact information for the organization',
    defaultMessage: 'Your training reference is {name} - {email}.',
  },
  contactButton: {
    id: 'components.DashboardItemOrder.OrganizationBlock.contactButton',
    description: 'Button to contact the organization',
    defaultMessage: 'Contact',
  },
  organizationHeader: {
    id: 'components.DashboardItemOrder.OrganizationBlock.organizationHeader',
    description: 'Header of the organization section',
    defaultMessage: 'This training is provided by',
  },
  organizationLogoAlt: {
    id: 'components.DashboardItemOrder.OrganizationBlock.organizationLogoAlt',
    description: 'Alt text for the organization logo',
    defaultMessage: 'Logo of the organization',
  },
  organizationMailContactLabel: {
    id: 'components.DashboardItemOrder.OrganizationBlock.organizationMailContactLabel',
    description: 'Label for the organization mail contact',
    defaultMessage: 'Email',
  },
  organizationPhoneContactLabel: {
    id: 'components.DashboardItemOrder.OrganizationBlock.organizationPhoneContactLabel',
    description: 'Label for the organization phone contact',
    defaultMessage: 'Phone',
  },
  organizationDpoContactLabel: {
    id: 'components.DashboardItemOrder.OrganizationBlock.organizationDpoContactLabel',
    description: 'Label for the organization DPO contact',
    defaultMessage: 'Data protection email',
  },
  organizationSubtitleAddress: {
    id: 'components.DashboardItemOrder.OrganizationBlock.organizationSubtitleAddress',
    description: 'Subtitle for the organization address section',
    defaultMessage: 'Address',
  },
  organizationSubtitleContacts: {
    id: 'components.DashboardItemOrder.OrganizationBlock.organizationSubtitleContacts',
    description: 'Subtitle for the organization contacts section',
    defaultMessage: 'Contacts',
  },
});

type Props = {
  product: Product;
  order: CredentialOrder;
};

const OrganizationBlock = ({ order, product }: Props) => {
  const { organization } = order;
  if (!organization) {
    return null;
  }

  const showContactsBlock =
    organization.contact_email || organization.contact_phone || organization.dpo_email;

  return (
    <div className="dashboard-splitted-card mt-s" data-testid="organization-block">
      <div className="dashboard-splitted-card__column order-organization__caption">
        <div className="dashboard-item-order__organization">
          <div className="dashboard-item-order__organization__header">
            <FormattedMessage {...messages.organizationHeader} />
          </div>
          <div
            className="dashboard-item-order__organization__logo"
            style={{
              backgroundImage: `url(${organization.logo?.src})`,
            }}
          />
          <div className="dashboard-item-order__organization__name">{organization.title}</div>
        </div>
      </div>
      <div className="dashboard-splitted-card__separator order-organization__separator" />
      <div className="dashboard-splitted-card__column order-organization__items">
        <ContractItem order={order} product={product} />
        {showContactsBlock && (
          <div className="dashboard-splitted-card__item">
            <div className="dashboard-splitted-card__item__title">
              <FormattedMessage {...messages.organizationSubtitleContacts} />
            </div>
            <div className="dashboard-splitted-card__item__description">
              {organization.contact_email && (
                <div className="organization-block__contact__item">
                  <FormattedMessage {...messages.organizationMailContactLabel} />
                  <Button
                    size="small"
                    color="tertiary"
                    href={'mailto:' + (organization.contact_email ?? '')}
                  >
                    {organization.contact_email}
                  </Button>
                </div>
              )}
              {organization.contact_phone && (
                <div className="organization-block__contact__item">
                  <FormattedMessage {...messages.organizationPhoneContactLabel} />
                  <Button
                    size="small"
                    color="tertiary"
                    href={'tel:' + (organization.contact_phone ?? '')}
                  >
                    {organization.contact_phone}
                  </Button>
                </div>
              )}
              {organization.dpo_email && (
                <div className="organization-block__contact__item">
                  <FormattedMessage {...messages.organizationDpoContactLabel} />
                  <Button
                    size="small"
                    color="tertiary"
                    href={'mailto:' + (organization.dpo_email ?? '')}
                  >
                    {organization.dpo_email}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
        {organization.address && (
          <div className="dashboard-splitted-card__item dashboard-splitted-card__item__address">
            <div className="dashboard-splitted-card__item__title">
              <FormattedMessage {...messages.organizationSubtitleAddress} />
            </div>
            <div className="dashboard-splitted-card__item__description">
              <AddressView address={organization.address} />
            </div>
          </div>
        )}
        <Installment order={order} />
      </div>
    </div>
  );
};

export default OrganizationBlock;
