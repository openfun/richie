import { call, put, takeLatest } from 'redux-saga/effects';

import { addOrganization, didGetOrganizations, failedToGetOrganizations } from './actions';
import { fetchOrganizations, getOrganizations } from './getOrganizationsSaga';

describe('data/organization getOrganizations saga', () => {
  const org43 = {
    banner: 'https://example.com/banner43.png',
    code: 'org-43',
    detail_page_enabled: false,
    id: 43,
    logo: 'https://example.com/logo43.png',
    name: 'Org 43',
  };
  const org44 = {
    banner: 'https://example.com/banner44.png',
    code: 'org-44',
    detail_page_enabled: false,
    id: 44,
    logo: 'https://example.com/logo44.png',
    name: 'Org 44',
  };

  describe('fetchOrganizations', () => {
    let realFetch: GlobalFetch['fetch'];
    let mockFetch: jasmine.Spy;

    beforeEach(() => {
      realFetch = window.fetch;
      mockFetch = jasmine.createSpy('fetch');
      window.fetch = mockFetch;
    });

    afterEach(() => {
      window.fetch = realFetch;
    });

    it('requests the organizations, parses the JSON response and resolves with the results', (done) => {
      mockFetch.and.returnValue(Promise.resolve({
        json: () => Promise.resolve({ results: [ org43, org44 ] }),
        ok: true,
      }));

      fetchOrganizations({ keys: [ 'org-43', 'org-44' ] })
      .then((response) => {
        // The correct request given parameters is performed
        expect(mockFetch).toHaveBeenCalledWith(
          '/organizations?keys=org-43&keys=org-44',
          { headers: { 'Content-Type': 'application/json' },
        });
        // Our polymorphic response object is properly shaped
        expect(response.error).not.toBeTruthy();
        expect(response.organizations).toEqual([ org43, org44 ]);
        done();
      });
    });

    it('returns an { error } object when it fails to get the organizations (local)', (done) => {
      mockFetch.and.returnValue(Promise.reject(new Error('Could not perform fetch.')));

      // Don't check params again as it was done in the first test
      fetchOrganizations({ keys: [ 'org-43', 'org-44' ] })
      .then((response) => {
        // Our polymorphic response object is properly shaped - with an error this time
        expect(response.organizations).not.toBeDefined();
        expect(response.error).toEqual(jasmine.any(Error));
        done();
      });
    });

    it('returns an { error } object when it fails to get the organizations (network)', (done) => {
      mockFetch.and.returnValue(Promise.resolve({ ok: false, status: 404 }));

      // Don't check params again as it was done in the first test
      fetchOrganizations({ keys: [ 'org-43', 'org-44' ] })
      .then((response) => {
        // Our polymorphic response object is properly shaped - with an error this time
        expect(response.organizations).not.toBeDefined();
        expect(response.error).toEqual(jasmine.any(Error));
        done();
      });
    });
  });

  describe('getOrganizations', () => {
    const action = {
      params: { keys: [ 'param' ] },
      type: 'ORGANIZATION_LIST_GET' as 'ORGANIZATION_LIST_GET',
    };

    it('calls fetchOrganizations, puts each org and yields a success action', () => {
      const gen = getOrganizations(action);

      // Mock a 'list of organizations' response with which to trigger the call to fetchOrganizations
      const response = {
        organizations: [ org43, org44 ],
      };

      // The call to fetch (the actual side-effect) is triggered
      expect(gen.next().value).toEqual(call(fetchOrganizations, action.params));

      // Both organizations are added to the state
      expect(gen.next(response).value).toEqual(put(addOrganization(response.organizations[0])));
      expect(gen.next().value).toEqual(put(addOrganization(response.organizations[1])));

      // The success action is dispatched
      expect(gen.next().value).toEqual(put(didGetOrganizations(response.organizations, action.params)));
    });

    it('yields a failure action when fetchOrganization fails', () => {
      const gen = getOrganizations(action);

      const response = {
        error: new Error('Failed to fetch organizations for some reason.'),
      };

      // The call to fetch is triggered, but fails for some reason
      expect(gen.next().value).toEqual(call(fetchOrganizations, action.params));

      // The failure action is dispatched
      expect(gen.next(response).value).toEqual(put(failedToGetOrganizations(response.error)));
    });
  });
});
