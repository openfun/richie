/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Serializer for order groups in a product.
 */
export type OrderGroup = {
  /**
   * primary key for the record as UUID
   */
  readonly id: string;
  readonly is_active: boolean;
  /**
   * The maximum number of orders that can be validated for a given order group
   */
  readonly nb_seats: number;
  /**
   * Return the number of available seats for this order group.
   */
  readonly nb_available_seats: number;
};

