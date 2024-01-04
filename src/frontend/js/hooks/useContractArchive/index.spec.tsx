import { faker } from '@faker-js/faker';
import fetchMock from 'fetch-mock';
import { renderHook } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { PropsWithChildren } from 'react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import JoanieApiProvider from 'contexts/JoanieApiContext';
import { HttpStatusCode } from 'utils/errors/HttpError';
import useContractArchive from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).one(),
}));

describe('useContractArchive', () => {
  const Wrapper = ({ children }: PropsWithChildren) => {
    return (
      <IntlProvider locale="en">
        <JoanieApiProvider>{children}</JoanieApiProvider>
      </IntlProvider>
    );
  };
  afterEach(() => {
    fetchMock.restore();
  });
  it.each([
    {
      label: `response code: ${HttpStatusCode.NO_CONTENT}`,
      statusCode: HttpStatusCode.NO_CONTENT,
      expectedValue: true,
    },
    {
      label: `response code: ${HttpStatusCode.NOT_FOUND}`,
      statusCode: HttpStatusCode.NOT_FOUND,
      expectedValue: false,
    },
    {
      label: `response code: ${HttpStatusCode.FORBIDDEN}`,
      statusCode: HttpStatusCode.FORBIDDEN,
      expectedValue: false,
    },
    {
      label: `response code: ${HttpStatusCode.INTERNAL_SERVER_ERROR}`,
      statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
      expectedValue: false,
    },
    {
      label: `response code: ${HttpStatusCode.UNAUTHORIZED}`,
      statusCode: HttpStatusCode.UNAUTHORIZED,
      expectedValue: false,
    },
  ])(
    'check method should return the right value for response code: $label',
    async ({ statusCode, expectedValue }) => {
      const contractArchiveId = faker.string.uuid();
      fetchMock.mock(
        (url, options) => {
          return (
            options.method === 'OPTIONS' &&
            url === `https://joanie.test/api/v1.0/contracts/zip-archive/${contractArchiveId}/`
          );
        },
        new Response('', { status: statusCode }),
      );

      const { result } = renderHook(useContractArchive, {
        wrapper: Wrapper,
      });
      const response = await result.current.methods.check(contractArchiveId);
      expect(response).toBe(expectedValue);
    },
  );

  it('create should return a contractArchiveId', async () => {
    const contractArchiveId = faker.string.uuid();
    fetchMock.post('https://joanie.test/api/v1.0/contracts/zip-archive/', {
      url: `http://test.url/uri/${contractArchiveId}/uri/?toto=tata`,
    });
    const { result } = renderHook(useContractArchive, {
      wrapper: Wrapper,
    });

    const organizationId = faker.string.uuid();
    const response = await result.current.methods.create(organizationId);
    expect(response).toBe(contractArchiveId);
  });
});
