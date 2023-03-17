import { rest } from 'msw';
import { getAPIEndpoint } from 'api/joanie';

interface DemoObj {
  id: string;
}
type DemoGetResponseBody = DemoObj[];

export const handlers = [
  rest.get<DemoGetResponseBody>(`${getAPIEndpoint()}/demo`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 'Dummy ID 1',
        },
        {
          id: 'Dummy ID 2',
        },
      ]),
    );
  }),
];
