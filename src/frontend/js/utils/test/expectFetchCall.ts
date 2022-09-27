import fetchMock, { InspectionFilter, InspectionOptions } from 'fetch-mock';

export const expectFetchCall = (
  filter: InspectionFilter,
  options: InspectionOptions,
  expectations: { body: Object },
) => {
  const { body } = fetchMock.lastCall(filter, options)![1]!;
  if (expectations.body) {
    expect(JSON.parse(body as string)).toEqual(expectations.body);
  }
};
