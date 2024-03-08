/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { LanguageEnum } from './LanguageEnum';

/**
 * Serializer for ContractDefinition model serializer
 */
export type ContractDefinition = {
  /**
   * primary key for the record as UUID
   */
  readonly id: string;
  readonly description: string;
  /**
   * Language of the contract definition
   *
   * * `en-us` - English
   * * `fr-fr` - French
   */
  readonly language: LanguageEnum;
  readonly title: string;
};

