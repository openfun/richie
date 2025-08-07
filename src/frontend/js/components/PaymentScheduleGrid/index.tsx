import { DataGrid } from '@openfun/cunningham-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { StringHelper } from 'utils/StringHelper';
import { PaymentSchedule, PaymentScheduleState } from 'types/Joanie';
import useDateFormat from 'hooks/useDateFormat';

type Props = {
  schedule: PaymentSchedule;
};

const messages = defineMessages({
  withdrawnAt: {
    id: 'components.PaymentScheduleGrid.withdrawnAt',
    defaultMessage: 'Withdrawn on {date}',
    description: 'Label displayed to explain when the installment will be withdrawn.',
  },
});

export const stateMessages = defineMessages({
  [PaymentScheduleState.PENDING]: {
    id: 'components.PaymentScheduleGrid.state.pending',
    defaultMessage: 'Pending',
    description: 'Label displayed for pending payment state',
  },
  [PaymentScheduleState.ERROR]: {
    id: 'components.PaymentScheduleGrid.state.error',
    defaultMessage: 'Pending',
    description:
      'Label displayed for error payment state. For learner we assume to display `pending`.',
  },
  [PaymentScheduleState.PAID]: {
    id: 'components.PaymentScheduleGrid.state.paid',
    defaultMessage: 'Paid',
    description: 'Label displayed for paid payment state',
  },
  [PaymentScheduleState.REFUSED]: {
    id: 'components.PaymentScheduleGrid.state.refused',
    defaultMessage: 'Refused',
    description: 'Label displayed for refused payment state',
  },
  [PaymentScheduleState.CANCELED]: {
    id: 'components.PaymentScheduleGrid.state.canceled',
    defaultMessage: 'Canceled',
    description: 'Label displayed for canceled payment state',
  },
  [PaymentScheduleState.REFUNDED]: {
    id: 'components.PaymentScheduleGrid.state.refunded',
    defaultMessage: 'Refunded',
    description: 'Label displayed for refunded payment state',
  },
});

export const PaymentScheduleGrid = ({ schedule }: Props) => {
  const intl = useIntl();
  const formatDate = useDateFormat();

  return (
    <div className="payment-schedule__grid">
      <DataGrid
        displayHeader={false}
        columns={[
          { field: 'index', size: 10 },
          { field: 'amount', size: 90 },
          {
            field: 'date',
            renderCell: ({ row }) => (
              <span className="payment-schedule__cell--wrapped">
                <FormattedMessage {...messages.withdrawnAt} values={{ date: row.date }} />
              </span>
            ),
          },
          {
            id: 'state',
            renderCell: ({ row }) =>
              row.state ? (
                <div className="payment-schedule__cell--alignRight">
                  <StatusPill state={row.state} />
                </div>
              ) : (
                ''
              ),
          },
        ]}
        rows={schedule.map((installment, index) => ({
          id: installment.id,
          index: index + 1,
          date: formatDate(installment.due_date),
          amount: intl.formatNumber(installment.amount, {
            style: 'currency',
            currency: installment.currency,
          }),
          state: installment.state,
        }))}
      />
    </div>
  );
};

export const StatusPill = ({ state }: { state: PaymentScheduleState }) => {
  return (
    <span className={`status-pill status-pill--${state}`}>
      {state in stateMessages ? (
        <FormattedMessage {...stateMessages[state]} />
      ) : (
        StringHelper.capitalizeFirst(state.replace('_', ' '))
      )}
    </span>
  );
};
