import { rest } from 'msw';
import { getAPIEndpoint } from 'api/joanie';
import { Contract, PaginatedResponse } from 'types/Joanie';
import { ContractFactory } from 'utils/test/factories/joanie';
import { PER_PAGE } from 'settings';

export const getContracts = rest.get<PaginatedResponse<Contract>>(
  `${getAPIEndpoint()}/contracts/`,
  (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        count: 250,
        results: ContractFactory().many(PER_PAGE.teacherContractList),
        next: null,
        previous: null,
      }),
    );
  },
);
