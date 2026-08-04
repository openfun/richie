import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Button, useModal } from '@openfun/cunningham-react';
import { CredentialOrder, OrderState, Product } from 'types/Joanie';
import { AddressView } from 'components/Address';
import { OrderHelper } from 'utils/OrderHelper';
import useDateFormat, { DATETIME_FORMAT } from 'hooks/useDateFormat';
import ContractItem from '../ContractItem';
import Installment from '../Installment';
import { OrderWithdrawalModal } from '../OrderWithdrawalModal';

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
  withdrawalTitle: {
    id: 'components.DashboardItemOrder.OrganizationBlock.withdrawalTitle',
    description: 'Title of the withdrawal block',
    defaultMessage: 'Withdrawal',
  },
  withdrawalDescription: {
    id: 'components.DashboardItemOrder.OrganizationBlock.withdrawalDescription',
    description: 'Description of the withdrawal block',
    defaultMessage: 'You can withdraw from your contract until {date}.',
  },
  withdrawalButton: {
    id: 'components.DashboardItemOrder.OrganizationBlock.withdrawalButton',
    description: 'Button label of the withdrawal block',
    defaultMessage: 'Withdraw',
  },
  pendingWithdrawalTitle: {
    id: 'components.DashboardItemOrder.OrganizationBlock.pendingWithdrawalTitle',
    description: 'Title of the withdrawal block while the request is being processed',
    defaultMessage: 'Withdrawal in progress',
  },
  pendingWithdrawalDescription: {
    id: 'components.DashboardItemOrder.OrganizationBlock.pendingWithdrawalDescription',
    description: 'Description shown while a withdrawal request is being processed',
    defaultMessage: 'Your withdrawal request has been recorded on {date} and is being processed.',
  },
  withdrawnTitle: {
    id: 'components.DashboardItemOrder.OrganizationBlock.withdrawnTitle',
    description: 'Title of the withdrawal block once the withdrawal is confirmed',
    defaultMessage: 'Withdrawn',
  },
  withdrawnDescription: {
    id: 'components.DashboardItemOrder.OrganizationBlock.withdrawnDescription',
    description: 'Description shown once the withdrawal is confirmed',
    defaultMessage: 'You withdrew from this order on {date}.',
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

  const hidePaymentBlock =
    OrderHelper.isFreeWithVoucher(order) || OrderHelper.isFreeFromBatchOrder(order);
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
                    color="brand"
                    variant="tertiary"
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
                    color="brand"
                    variant="tertiary"
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
                    color="brand"
                    variant="tertiary"
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
        {!hidePaymentBlock && <Installment order={order} />}
        {!order.has_waived_withdrawal_right && order.eligible_to_withdraw && (
          <Withdrawal order={order} product={product} />
        )}
        {order.state === OrderState.PENDING_WITHDRAW && <PendingWithdrawalStatus order={order} />}
        {OrderHelper.isWithdrawn(order) && <WithdrawnStatus order={order} />}
      </div>
    </div>
  );
};

const Withdrawal = ({ order, product }: Props) => {
  const intl = useIntl();
  const formatDate = useDateFormat(DATETIME_FORMAT);
  const modal = useModal();

  return (
    <div data-testid="dashboard-item-withdrawal" className="dashboard-splitted-card__item">
      <div className="dashboard-splitted-card__item__title">
        <span>
          <FormattedMessage {...messages.withdrawalTitle} />
        </span>
      </div>
      <p className="dashboard-splitted-card__item__description">
        <FormattedMessage
          {...messages.withdrawalDescription}
          values={{ date: formatDate(order.withdrawal_date_limit) }}
        />
      </p>
      <div className="dashboard-splitted-card__item__actions">
        <Button
          size="small"
          color="brand"
          variant="tertiary"
          className="dashboard-item-order__withdrawal-button"
          onClick={modal.open}
        >
          {intl.formatMessage(messages.withdrawalButton)}
        </Button>
      </div>
      <OrderWithdrawalModal
        {...modal}
        order={order}
        productTitle={product.title}
        reference={order.course.code}
      />
    </div>
  );
};

const PendingWithdrawalStatus = ({ order }: { order: CredentialOrder }) => {
  const formatDate = useDateFormat(DATETIME_FORMAT);

  return (
    <div data-testid="dashboard-item-pending-withdrawal" className="dashboard-splitted-card__item">
      <div className="dashboard-splitted-card__item__title">
        <span>
          <FormattedMessage {...messages.pendingWithdrawalTitle} />
        </span>
      </div>
      <p className="dashboard-splitted-card__item__description">
        <FormattedMessage
          {...messages.pendingWithdrawalDescription}
          values={{ date: formatDate(order.withdrawn_requested_at) }}
        />
      </p>
    </div>
  );
};

const WithdrawnStatus = ({ order }: { order: CredentialOrder }) => {
  const formatDate = useDateFormat(DATETIME_FORMAT);

  return (
    <div data-testid="dashboard-item-withdrawn" className="dashboard-splitted-card__item">
      <div className="dashboard-splitted-card__item__title">
        <span>
          <FormattedMessage {...messages.withdrawnTitle} />
        </span>
      </div>
      <p className="dashboard-splitted-card__item__description">
        <FormattedMessage
          {...messages.withdrawnDescription}
          values={{ date: formatDate(order.withdrawn_confirmation_at) }}
        />
      </p>
    </div>
  );
};

export default OrganizationBlock;
