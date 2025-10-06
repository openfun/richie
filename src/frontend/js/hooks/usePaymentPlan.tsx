import { useQuery } from '@tanstack/react-query';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { PaymentPlan } from 'types/Joanie';
import { Nullable } from 'types/utils';
import { HttpError } from 'utils/errors/HttpError';

type PaymentPlanFilters = {
  course_code: string;
  product_id: string;
  voucher_code?: string;
};

export const usePaymentPlan = (filters: PaymentPlanFilters) => {
  const queryKey = ['courses-products', ...Object.values(filters), 'payment-plan'];

  const api = useJoanieApi();
  return useQuery<Nullable<PaymentPlan>, HttpError>({
    queryKey,
    queryFn: () =>
      api.courses.products.paymentPlan.get({
        id: filters.product_id,
        course_id: filters.course_code,
        voucher_code: filters.voucher_code,
      }),
  });
};
