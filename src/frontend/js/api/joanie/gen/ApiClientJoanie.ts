/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';

import { AddressesService } from './services/AddressesService';
import { CertificatesService } from './services/CertificatesService';
import { ContractDefinitionsService } from './services/ContractDefinitionsService';
import { ContractsService } from './services/ContractsService';
import { CourseProductRelationsService } from './services/CourseProductRelationsService';
import { CourseRunsService } from './services/CourseRunsService';
import { CourseRunsSyncService } from './services/CourseRunsSyncService';
import { CoursesService } from './services/CoursesService';
import { CreditCardsService } from './services/CreditCardsService';
import { EnrollmentsService } from './services/EnrollmentsService';
import { OrdersService } from './services/OrdersService';
import { OrganizationsService } from './services/OrganizationsService';
import { PaymentsService } from './services/PaymentsService';
import { SignatureService } from './services/SignatureService';
import { UsersService } from './services/UsersService';

type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;

export class ApiClientJoanie {

  public readonly addresses: AddressesService;
  public readonly certificates: CertificatesService;
  public readonly contractDefinitions: ContractDefinitionsService;
  public readonly contracts: ContractsService;
  public readonly courseProductRelations: CourseProductRelationsService;
  public readonly courseRuns: CourseRunsService;
  public readonly courseRunsSync: CourseRunsSyncService;
  public readonly courses: CoursesService;
  public readonly creditCards: CreditCardsService;
  public readonly enrollments: EnrollmentsService;
  public readonly orders: OrdersService;
  public readonly organizations: OrganizationsService;
  public readonly payments: PaymentsService;
  public readonly signature: SignatureService;
  public readonly users: UsersService;

  public readonly request: BaseHttpRequest;

  constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
    this.request = new HttpRequest({
      BASE: config?.BASE ?? '',
      VERSION: config?.VERSION ?? '1.0.0 (v1.0)',
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
    this.contractDefinitions = new ContractDefinitionsService(this.request);
    this.contracts = new ContractsService(this.request);
    this.courseProductRelations = new CourseProductRelationsService(this.request);
    this.courseRuns = new CourseRunsService(this.request);
    this.courseRunsSync = new CourseRunsSyncService(this.request);
    this.courses = new CoursesService(this.request);
    this.creditCards = new CreditCardsService(this.request);
    this.enrollments = new EnrollmentsService(this.request);
    this.orders = new OrdersService(this.request);
    this.organizations = new OrganizationsService(this.request);
    this.payments = new PaymentsService(this.request);
    this.signature = new SignatureService(this.request);
    this.users = new UsersService(this.request);
  }
}

