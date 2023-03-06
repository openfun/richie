/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Order } from './Order';
import type { Payment } from './Payment';

export type OrderCreateResponse = {
  order: Order;
  payment_info?: Payment;
};

