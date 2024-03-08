import { http, HttpResponse } from 'msw';
import { getAPIEndpointLegacy } from 'api/joanie';
import { Contract, PaginatedResponse } from 'types/Joanie';
import { ContractFactory } from 'utils/test/factories/joanieLegacy';
import { PER_PAGE } from 'settings';

export default [
  http.get(`${getAPIEndpointLegacy()}/contracts/`, () => {
    return HttpResponse.json<PaginatedResponse<Contract>>({
      count: 250,
      results: ContractFactory().many(PER_PAGE.teacherContractList),
      next: null,
      previous: null,
    });
  }),
];
