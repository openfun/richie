import { DataList } from '@openfun/cunningham-react';
import { StringHelper } from 'utils/StringHelper';

export const PaymentScheduleGrid = () => {
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
            id: 'status',
            renderCell: (context) =>
              context.row.status ? <StatusPill status={context.row.status} /> : '',
          },
        ]}
        rows={[
          {
            id: '1',
            date: '2023-03-15',
            amount: '€ 100.00',
            status: PaymentScheduleStatus.PAID,
          },
          {
            id: '2',
            date: '2023-04-15',
            amount: '€ 100.00',
            status: PaymentScheduleStatus.REQUIRE_PAYMENT,
          },
          {
            id: '3',
            date: '2023-05-15',
            amount: '€ 100.00',
            status: PaymentScheduleStatus.FAILED,
          },
          {
            id: '4',
            date: '2023-06-15',
            amount: '€ 100.00',
            status: PaymentScheduleStatus.INCOMING,
          },
          {
            id: '5',
            date: '2023-06-15',
            amount: '€ 100.00',
            status: PaymentScheduleStatus.PENDING,
          },
          {
            id: 'total',
            date: 'Total',
            amount: '€ 1150.00',
          },
        ]}
      />
    </div>
  );
};

export enum PaymentScheduleStatus {
  INCOMING = 'incoming',
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REQUIRE_PAYMENT = 'require_payment',
}

export const StatusPill = ({ status }: { status: PaymentScheduleStatus }) => {
  return (
    <span className={`status-pill status-pill--${status}`}>
      {StringHelper.capitalizeFirst(status.replace('_', ' '))}
    </span>
  );
};
