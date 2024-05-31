import { DataList } from '@openfun/cunningham-react';
import { useIntl } from 'react-intl';
import { StringHelper } from 'utils/StringHelper';
import { OrderPaymentSchedule, PaymentScheduleState } from 'types/Joanie';

export const PaymentScheduleGrid = ({
  paymentSchedule,
}: {
  paymentSchedule: OrderPaymentSchedule;
}) => {
  const intl = useIntl();
  return (
    <div className="payment-schedule__grid">
      <DataList
        columns={[
          {
            id: 'date',
            renderCell: (context) =>
              context.row.id === 'total' ? <strong>{context.row.date}</strong> : context.row.date,
          },
          {
            id: 'amount',
            renderCell: (context) =>
              context.row.id === 'total' ? (
                <strong>{context.row.amount}</strong>
              ) : (
                context.row.amount
              ),
          },
          {
            id: 'state',
            renderCell: (context) =>
              context.row.state ? <StatusPill state={context.row.state} /> : '',
          },
        ]}
        rows={paymentSchedule.map((installment) => ({
          id: installment.due_date,
          date: installment.due_date,
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
      {StringHelper.capitalizeFirst(state.replace('_', ' '))}
    </span>
  );
};
