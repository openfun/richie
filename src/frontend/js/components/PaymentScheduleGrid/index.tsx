import { DataList } from '@openfun/cunningham-react';
import { useIntl } from 'react-intl';
import { StringHelper } from 'utils/StringHelper';
import { PaymentSchedule, PaymentScheduleState } from 'types/Joanie';

type Props = {
  schedule: PaymentSchedule;
};

export const PaymentScheduleGrid = ({ schedule }: Props) => {
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
        rows={schedule.map((installment) => ({
          id: installment.id,
          date: installment.due_date,
          amount: intl.formatNumber(installment.amount, {
            currency: installment.currency,
            style: 'currency',
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
