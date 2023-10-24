import { http, HttpResponse } from 'msw';
import { getAPIEndpoint } from 'api/joanie';
import { Contract, PaginatedResponse } from 'types/Joanie';
import { ContractFactory } from 'utils/test/factories/joanie';
import { PER_PAGE } from 'settings';

export default [
  http.get(`${getAPIEndpoint()}/contracts/`, () => {
    return HttpResponse.json<PaginatedResponse<Contract>>({
      count: 250,
      results: ContractFactory().many(PER_PAGE.teacherContractList),
      next: null,
      previous: null,
    });
  }),
];
