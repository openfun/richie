import { useQuery } from '@tanstack/react-query';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { PaymentSchedule } from 'types/Joanie';
import { Nullable } from 'types/utils';

type PaymentScheduleFilters = {
  course_code: string;
  product_id: string;
};

export const usePaymentSchedule = (filters: PaymentScheduleFilters) => {
  const queryKey = ['courses-products', ...Object.values(filters), 'payment-schedule'];

  const api = useJoanieApi();
  return useQuery<Nullable<PaymentSchedule>, Error>({
    queryKey,
    queryFn: () =>
      api.courses.products.paymentSchedule.get({
        id: filters.product_id,
        course_id: filters.course_code,
      }),
  });
};
