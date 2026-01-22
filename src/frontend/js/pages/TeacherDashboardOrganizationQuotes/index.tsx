import { defineMessages, FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import { Button, Input, Modal, ModalSize } from '@openfun/cunningham-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import Banner, { BannerType } from 'components/Banner';
import { useOrganizationsQuotes } from 'hooks/useOrganizationQuotes';
import { useOrganization } from 'hooks/useOrganizations';
import { TeacherDashboardContractsParams } from 'pages/TeacherDashboardContractsLayout/hooks/useTeacherContractFilters';
import { BatchOrderState, OrganizationQuote } from 'types/Joanie';
import { PaymentMethod } from 'components/PaymentInterfaces/types';
import { DashboardCard } from 'widgets/Dashboard/components/DashboardCard';
import { Pagination, usePagination } from 'components/Pagination';
import Badge from 'components/Badge';
import { Icon, IconTypeEnum } from 'components/Icon';
import { browserDownloadFromBlob } from 'utils/download';
import { Spinner } from 'components/Spinner';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading organization quotes...',
    description: 'Message displayed while loading organization quotes',
    id: 'components.OrganizationQuotesTable.loading',
  },
  columnTitle: {
    defaultMessage: 'Title',
    id: 'components.OrganizationQuotesTable.columnTitle',
    description: 'Title column in the quotes table',
  },
  columnCompany: {
    defaultMessage: 'Company',
    id: 'components.OrganizationQuotesTable.columnCompany',
    description: 'Company column in the quotes table',
  },
  columnOwner: {
    defaultMessage: 'Owner',
    id: 'components.OrganizationQuotesTable.columnOwner',
    description: 'Owner column in the quotes table',
  },
  columnState: {
    defaultMessage: 'State',
    id: 'components.OrganizationQuotesTable.columnState',
    description: 'State column in the quotes table',
  },
  columnSignedOn: {
    defaultMessage: 'Signed on',
    id: 'components.OrganizationQuotesTable.columnSignedOn',
    description: 'Signed on date column in the quotes table',
  },
  columnPayment: {
    defaultMessage: 'Payment method',
    id: 'components.OrganizationQuotesTable.payment',
    description: 'Payment method column in the quotes table',
  },
  columnActions: {
    defaultMessage: 'Actions',
    id: 'components.OrganizationQuotesTable.columnActions',
    description: 'Actions column in the quotes table',
  },
  confirmQuote: {
    defaultMessage: 'Confirm quote',
    id: 'components.OrganizationQuotesTable.confirmQuote',
    description: 'Label for the action to confirm a quote',
  },
  confirmPurchaseOrder: {
    defaultMessage: 'Confirm receipt of purchase order',
    id: 'components.OrganizationQuotesTable.confirmPurchaseOrder',
    description: 'Label for confirming receipt of a purchase order',
  },
  purchaseOrderModalTitle: {
    defaultMessage: 'Confirm purchase order',
    id: 'components.OrganizationQuotesTable.purchaseOrderModalTitle',
    description: 'Title of the confirm purchase order modal',
  },
  purchaseOrderReferenceLabel: {
    defaultMessage: 'Purchase order reference',
    id: 'components.OrganizationQuotesTable.purchaseOrderReferenceLabel',
    description: 'Label for the purchase order reference input',
  },
  confirmBank: {
    defaultMessage: 'Confirm bank transfer',
    id: 'components.OrganizationQuotesTable.confirmBank',
    description: 'Label for confirming a bank transfer',
  },
  sendForSignature: {
    defaultMessage: 'Send contract for signature',
    id: 'components.OrganizationQuotesTable.sendForSignature',
    description: 'Action label to send a contract for signature',
  },
  waitingSignature: {
    defaultMessage: 'Waiting signature',
    id: 'components.OrganizationQuotesTable.waitingSignature',
    description: 'Label for a quote waiting for signature',
  },
  waitingPayment: {
    defaultMessage: 'Waiting payment',
    id: 'components.OrganizationQuotesTable.waitingPayment',
    description: 'Label for a quote waiting for payment',
  },
  processingPayment: {
    defaultMessage: 'Processing payment',
    id: 'components.OrganizationQuotesTable.processingPayment',
    description: 'Label when Lyra is processing for payment',
  },
  payAmount: {
    defaultMessage: 'Waiting for payment',
    id: 'components.OrganizationQuotesTable.payAmount',
    description: 'Label indicating the amount is pending payment',
  },
  downloadQuote: {
    defaultMessage: 'Download quote',
    id: 'components.OrganizationQuotesTable.downloadQuote',
    description: 'Action label to download the quote',
  },
  modalTitle: {
    defaultMessage: 'Confirm quote',
    id: 'components.OrganizationQuotesTable.modalTitle',
    description: 'Title of the confirm quote modal',
  },
  modalAmountLabel: {
    defaultMessage: 'Total amount',
    id: 'components.OrganizationQuotesTable.modalAmountLabel',
    description: 'Label for the total amount in the modal',
  },
  modalCancel: {
    defaultMessage: 'Cancel',
    id: 'components.OrganizationQuotesTable.modalCancel',
    description: 'Cancel button text in modal',
  },
  noQuotes: {
    defaultMessage: 'No quotes found for this organization.',
    id: 'components.OrganizationQuotesTable.noQuotes',
    description: 'Message displayed when no quotes exist for the organization',
  },
  paymentCard: {
    defaultMessage: 'Credit card',
    id: 'components.OrganizationQuotesTable.paymentCard',
    description: 'Payment method: credit card',
  },
  paymentPurchaseOrder: {
    defaultMessage: 'Purchase order',
    id: 'components.OrganizationQuotesTable.paymentPurchaseOrder',
    description: 'Payment method: purchase order',
  },
  paymentBankTransfer: {
    defaultMessage: 'Bank transfer',
    id: 'components.OrganizationQuotesTable.paymentBankTransfer',
    description: 'Payment method: bank transfer',
  },
  [BatchOrderState.QUOTED]: {
    id: 'components.OrganizationQuotesTable.state.quoted',
    defaultMessage: 'Quoted',
    description: 'Batch order state: quoted',
  },
  [BatchOrderState.TO_SIGN]: {
    id: 'components.OrganizationQuotesTable.state.toSign',
    defaultMessage: 'To sign',
    description: 'Batch order state: to be signed',
  },
  [BatchOrderState.SIGNING]: {
    id: 'components.OrganizationQuotesTable.state.signing',
    defaultMessage: 'Signing',
    description: 'Batch order state: currently being signed',
  },
  [BatchOrderState.PROCESS_PAYMENT]: {
    id: 'batchOrder.status.processPayment',
    description: 'Status label for a process payment batch order',
    defaultMessage: 'Process payment',
  },
  [BatchOrderState.COMPLETED]: {
    id: 'components.OrganizationQuotesTable.state.completed',
    defaultMessage: 'Completed',
    description: 'Batch order state: completed',
  },
  [BatchOrderState.DRAFT]: {
    id: 'components.OrganizationQuotesTable.state.draft.',
    defaultMessage: 'Draft',
    description: 'Batch order state: draft',
  },
  [BatchOrderState.ASSIGNED]: {
    id: 'components.OrganizationQuotesTable.state.assigned.',
    defaultMessage: 'Assigned',
    description: 'Batch order state: assigned',
  },
  [BatchOrderState.PENDING]: {
    id: 'components.OrganizationQuotesTable.state.pending.',
    defaultMessage: 'Pending',
    description: 'Batch order state: pending',
  },
  [BatchOrderState.FAILED_PAYMENT]: {
    id: 'components.OrganizationQuotesTable.state.failedPayment.',
    defaultMessage: 'Failed payment',
    description: 'Batch order state: failed payment',
  },
  [BatchOrderState.CANCELED]: {
    id: 'components.OrganizationQuotesTable.state.canceled',
    defaultMessage: 'Canceled',
    description: 'Batch order state: canceled',
  },
  [PaymentMethod.CARD_PAYMENT]: {
    id: 'components.OrganizationQuotesTable.payment.card',
    defaultMessage: 'Card payment',
    description: 'Payment method: card payment',
  },
  [PaymentMethod.PURCHASE_ORDER]: {
    id: 'components.OrganizationQuotesTable.payment.purchaseOrder',
    defaultMessage: 'Purchase order',
    description: 'Payment method: purchase order',
  },
  [PaymentMethod.BANK_TRANSFER]: {
    id: 'components.OrganizationQuotesTable.payment.bankTransfer',
    defaultMessage: 'Bank transfer',
    description: 'Payment method: bank transfer',
  },
  batchOrderId: {
    id: 'components.OrganizationQuotesTable.batchOrderId',
    defaultMessage: 'Batch order id: {id}',
    description: 'Label for the batch order reference (id)',
  },
  seats: {
    id: 'batchOrder.seats',
    defaultMessage: '{seats} {seats, plural, one {seat} other {seats}}',
    description: 'Text displayed for seats value in batch order',
  },
});

const TeacherDashboardOrganizationQuotes = () => {
  const intl = useIntl();
  const { organizationId: routeOrganizationId } = useParams<TeacherDashboardContractsParams>();
  const {
    item: organization,
    states: { isPending: isOrganizationPending },
  } = useOrganization(routeOrganizationId);

  const abilities = organization?.abilities;

  const pagination = usePagination({ itemsPerPage: 10 });

  const {
    quotes,
    confirmQuote,
    confirmPurchaseOrder,
    confirmBankTransfer,
    submitForSignature,
    downloadQuote,
  } = useOrganizationsQuotes();

  const {
    items: quotesList,
    states: { error, isPending },
    meta,
    methods: { invalidate },
  } = quotes({
    organization_id: routeOrganizationId,
    page: pagination.currentPage,
    page_size: pagination.itemsPerPage,
  });

  const [selectedQuote, setSelectedQuote] = useState<OrganizationQuote | null>(null);
  const [amount, setAmount] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedPurchaseOrderQuote, setSelectedPurchaseOrderQuote] =
    useState<OrganizationQuote | null>(null);
  const [purchaseOrderReference, setPurchaseOrderReference] = useState('');
  const [isPurchaseOrderModalOpen, setIsPurchaseOrderModalOpen] = useState(false);

  useEffect(() => {
    if (meta?.pagination?.count) {
      pagination.setItemsCount(meta.pagination.count);
    }
  }, [meta?.pagination?.count]);

  if (error) return <Banner message={error} type={BannerType.ERROR} rounded />;

  if (isPending || isOrganizationPending)
    return (
      <Spinner size="large">
        <span id="loading-contract-data">
          <FormattedMessage {...messages.loading} />
        </span>
      </Spinner>
    );

  if (!isPending && !error && quotesList.length === 0)
    return (
      <Banner type={BannerType.INFO} rounded message={intl.formatMessage(messages.noQuotes)} />
    );

  const handleOpenConfirm = (id: string) => {
    const quote = quotesList.find((q) => q.id === id);
    if (!quote) return;
    setSelectedQuote(quote);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setAmount('');
    setSelectedQuote(null);
  };

  const handleConfirmQuote = async () => {
    if (!selectedQuote) return;
    await confirmQuote({
      organization_id: routeOrganizationId,
      payload: { total: amount, quote_id: selectedQuote.id },
    });
    handleCancel();
    await invalidate();
  };

  const handleOpenPurchaseOrderModal = (quote: OrganizationQuote) => {
    setSelectedPurchaseOrderQuote(quote);
    setIsPurchaseOrderModalOpen(true);
  };

  const handleCancelPurchaseOrder = () => {
    setIsPurchaseOrderModalOpen(false);
    setPurchaseOrderReference('');
    setSelectedPurchaseOrderQuote(null);
  };

  const handleConfirmPurchaseOrder = async () => {
    if (!selectedPurchaseOrderQuote) return;
    await confirmPurchaseOrder({
      organization_id: routeOrganizationId,
      payload: {
        quote_id: selectedPurchaseOrderQuote.id,
        purchase_order_reference: purchaseOrderReference,
      },
    });
    handleCancelPurchaseOrder();
    await invalidate();
  };

  const handleConfirmBankTransfer = async (id: string) => {
    await confirmBankTransfer({
      organization_id: routeOrganizationId,
      payload: { batch_order_id: id },
    });
    await invalidate();
  };

  const handleSubmitForSignature = async (id: string) => {
    await submitForSignature({
      organization_id: routeOrganizationId,
      payload: { batch_order_id: id },
    });
    await invalidate();
  };

  const handleDownloadQuote = async (id: string) => {
    await browserDownloadFromBlob(
      () =>
        downloadQuote({
          organization_id: routeOrganizationId,
          quote_id: id,
        }),
      true,
    );
  };

  const renderActionButton = (quote: OrganizationQuote) => {
    const batchOrder = quote.batch_order;
    const state = batchOrder?.state;
    const paymentMethod = batchOrder?.payment_method;

    if (!batchOrder || !state || !paymentMethod || state === BatchOrderState.COMPLETED) return null;

    const confirmQuoteButtons = (
      <div>
        <Button
          size="small"
          color="secondary"
          className="mr-2"
          onClick={() => handleDownloadQuote(quote.id)}
          icon={<span className="material-icons">download</span>}
          disabled={!abilities?.download_quote}
        >
          {intl.formatMessage(messages.downloadQuote)}
        </Button>
        <Button
          size="small"
          onClick={() => handleOpenConfirm(quote.id)}
          icon={<span className="material-icons">check_circle</span>}
          disabled={!abilities?.confirm_quote}
        >
          {intl.formatMessage(messages.confirmQuote)}
        </Button>
      </div>
    );

    const confirmPurchaseOrderButton = (
      <Button
        size="small"
        className="ml-2"
        onClick={() => handleOpenPurchaseOrderModal(quote)}
        icon={<span className="material-icons">description</span>}
      >
        {intl.formatMessage(messages.confirmPurchaseOrder)}
      </Button>
    );

    const confirmBankTransferButton = (
      <Button
        size="small"
        onClick={() => handleConfirmBankTransfer(quote.batch_order.id)}
        icon={<span className="material-icons">account_balance</span>}
        disabled={!abilities?.confirm_bank_transfer}
      >
        {intl.formatMessage(messages.confirmBank)}
      </Button>
    );

    const submitForSignatureButton = (
      <Button
        size="small"
        disabled={batchOrder.contract_submitted || !abilities?.can_submit_for_signature_batch_order}
        onClick={() =>
          !batchOrder.contract_submitted && handleSubmitForSignature(quote.batch_order.id)
        }
        icon={<span className="material-icons">send</span>}
      >
        {batchOrder.contract_submitted
          ? intl.formatMessage(messages.waitingSignature)
          : intl.formatMessage(messages.sendForSignature)}
      </Button>
    );

    switch (batchOrder.available_actions?.next_action) {
      case 'confirm_quote':
        return confirmQuoteButtons;
      case 'confirm_purchase_order':
        return confirmPurchaseOrderButton;
      case 'confirm_bank_transfer':
        return confirmBankTransferButton;
      case 'submit_for_signature':
        return submitForSignatureButton;
    }

    switch (paymentMethod) {
      case PaymentMethod.CARD_PAYMENT:
        switch (state) {
          case BatchOrderState.PENDING:
            return (
              <Button
                size="small"
                disabled
                icon={<span className="material-icons">hourglass_empty</span>}
              >
                {intl.formatMessage(messages.waitingPayment)}
              </Button>
            );
          case BatchOrderState.PROCESS_PAYMENT:
            return (
              <Button size="small" disabled icon={<span className="material-icons">sync</span>}>
                {intl.formatMessage(messages.processingPayment)}
              </Button>
            );
        }
        break;
    }

    switch (state) {
      case BatchOrderState.TO_SIGN:
        return submitForSignatureButton;
    }

    return null;
  };

  return (
    <div className="dashboard__quotes">
      {quotesList.map((quote) => (
        <DashboardCard
          key={quote.id}
          header={
            <div className="dashboard__quote__header">
              <div className="dashboard__quote__header__main">
                <span>{quote.batch_order.relation.product.title}</span>
                {quote.batch_order.state && (
                  <Badge color="secondary">
                    <FormattedMessage {...messages[quote.batch_order.state]} />
                  </Badge>
                )}
              </div>
              <div className="dashboard__quote__header__action">{renderActionButton(quote)}</div>
            </div>
          }
          defaultExpanded={false}
        >
          <div className="dashboard__quote__informations">
            <div className="dashboard__quote__reference">
              <Icon name={IconTypeEnum.BARCODE} size="small" />
              <span>
                {intl.formatMessage(messages.batchOrderId, {
                  id: quote.batch_order.id,
                })}
              </span>
            </div>
            {quote.batch_order.owner_name && (
              <div className="dashboard__quote__information">
                <Icon name={IconTypeEnum.LOGIN} size="small" />
                <span>{quote.batch_order.owner_name}</span>
              </div>
            )}
            {quote.batch_order.company_name && (
              <div className="dashboard__quote__information">
                <Icon name={IconTypeEnum.ORG} size="small" />
                <span>{quote.batch_order.company_name}</span>
              </div>
            )}
            {quote.batch_order.nb_seats && (
              <div className="dashboard__quote__information">
                <Icon name={IconTypeEnum.GROUPS} size="small" />
                <div>
                  <span>
                    {intl.formatMessage(messages.seats, { seats: quote.batch_order.nb_seats })}
                  </span>
                </div>
              </div>
            )}
            {quote.total && (
              <div className="dashboard__quote__information">
                <Icon name={IconTypeEnum.MONEY} size="small" />
                <FormattedNumber value={quote.total} currency="EUR" style="currency" />
              </div>
            )}
            {quote.batch_order.payment_method && (
              <div className="dashboard__quote__information">
                <Icon name={IconTypeEnum.OFFER_SUBSCRIPTION} size="small" />
                <FormattedMessage {...messages[quote.batch_order.payment_method]} />
              </div>
            )}
          </div>
        </DashboardCard>
      ))}
      <Pagination {...pagination} />
      <Modal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title={intl.formatMessage(messages.modalTitle)}
        size={ModalSize.MEDIUM}
        actions={
          <Button size="small" onClick={handleConfirmQuote}>
            {intl.formatMessage(messages.confirmQuote)}
          </Button>
        }
      >
        <div className="dashboard__quote__modal">
          <Input
            type="number"
            label={intl.formatMessage(messages.modalAmountLabel)}
            onChange={(e) => setAmount(e.target.value)}
            value={amount}
          />
        </div>
      </Modal>
      <Modal
        isOpen={isPurchaseOrderModalOpen}
        onClose={handleCancelPurchaseOrder}
        title={intl.formatMessage(messages.purchaseOrderModalTitle)}
        size={ModalSize.MEDIUM}
        actions={
          <Button size="small" onClick={handleConfirmPurchaseOrder}>
            {intl.formatMessage(messages.confirmPurchaseOrder)}
          </Button>
        }
      >
        <div className="dashboard__quote__modal">
          <Input
            type="text"
            label={intl.formatMessage(messages.purchaseOrderReferenceLabel)}
            onChange={(e) => setPurchaseOrderReference(e.target.value)}
            value={purchaseOrderReference}
          />
        </div>
      </Modal>
    </div>
  );
};

export default TeacherDashboardOrganizationQuotes;
