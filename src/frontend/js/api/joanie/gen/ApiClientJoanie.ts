/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';

import { AddressesService } from './services/AddressesService';
import { CertificatesService } from './services/CertificatesService';
import { CourseRunsService } from './services/CourseRunsService';
import { CourseRunsSyncService } from './services/CourseRunsSyncService';
import { CreditCardsService } from './services/CreditCardsService';
import { EnrollmentsService } from './services/EnrollmentsService';
import { OrdersService } from './services/OrdersService';
import { PaymentsService } from './services/PaymentsService';
import { ProductsService } from './services/ProductsService';

type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;

export class ApiClientJoanie {

  public readonly addresses: AddressesService;
  public readonly certificates: CertificatesService;
  public readonly courseRuns: CourseRunsService;
  public readonly courseRunsSync: CourseRunsSyncService;
  public readonly creditCards: CreditCardsService;
  public readonly enrollments: EnrollmentsService;
  public readonly orders: OrdersService;
  public readonly payments: PaymentsService;
  public readonly products: ProductsService;

  public readonly request: BaseHttpRequest;

  constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
    this.request = new HttpRequest({
      BASE: config?.BASE ?? 'http://localhost:8071/api/v1.0',
      VERSION: config?.VERSION ?? '1.0',
      WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
      CREDENTIALS: config?.CREDENTIALS ?? 'include',
      TOKEN: config?.TOKEN,
      USERNAME: config?.USERNAME,
      PASSWORD: config?.PASSWORD,
      HEADERS: config?.HEADERS,
      ENCODE_PATH: config?.ENCODE_PATH,
    });

    this.addresses = new AddressesService(this.request);
    this.certificates = new CertificatesService(this.request);
    this.courseRuns = new CourseRunsService(this.request);
    this.courseRunsSync = new CourseRunsSyncService(this.request);
    this.creditCards = new CreditCardsService(this.request);
    this.enrollments = new EnrollmentsService(this.request);
    this.orders = new OrdersService(this.request);
    this.payments = new PaymentsService(this.request);
    this.products = new ProductsService(this.request);
  }
}

