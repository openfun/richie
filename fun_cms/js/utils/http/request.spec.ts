import isEqual from 'lodash-es/isEqual';
import mock from 'xhr-mock';

import { r, RequestFormattedResponse } from './request';

describe('utils/http - request()', () => {
  beforeEach(() => {
    mock.setup();
  });

  afterEach(() => {
    mock.teardown();
  });

  it('does not fire the request until someone has subscribed', () => {
    const spy = jasmine.createSpy('spy');

    mock.get('/api/v1/subject', (req, res) => {
      spy();
      return res.status(200);
    });

    const request$ = r.get('/api/v1/subject');
    expect(spy).not.toHaveBeenCalled();

    request$.subscribe(() => {
      expect(spy).toHaveBeenCalled();
    });
  });

  it('sends the request and returns the response through an observable', () => {
    mock.get('/api/v1/subject', (req, res) => {
      expect(req.header('Content-Type')).toEqual('application/json');
      return res
      .body(JSON.stringify({ code: 'literature', name: 'Littérature' }))
      .header('Content-Type', 'application/json')
      .status(200);
    });

    r.get('/api/v1/subject')
    .subscribe(({ response, status }: RequestFormattedResponse) => {
      expect(response).toEqual({ code: 'literature', name: 'Littérature' });
      expect(status).toEqual(200);
    });
  });

  it('formats an error response when it encounters an error code', () => {
    mock.get('/api/v1/organization/42', (req, res) => {
      return res
      .body('NOT FOUND')
      .status(404);
    });

    r.get('/api/v1/organization/42')
    .subscribe(null, (error) => {
      expect(error).not.toEqual(jasmine.any(Error));
      expect(error.status).toEqual(404);
    });
  });

  it('returns an Error when the request fails to send', () => {
    mock.get('/api/v1/course', (req, res) => {
      return res.status(0);
    });

    r.get('/api/v1/course')
    .subscribe(null, (error) => {
      expect(error).toEqual(jasmine.any(Error));
    });
  });

  it('applies the params when it is passed a params object', (done) => {
    mock.get('/api/v1/course?lang=fr', (req, res) => {
      expect(true).toBeTruthy(); // The mere fact we're passing through here means it worked: URLs matched
      done();
      return res.status(200);
    });

    r.get('/api/v1/course', { params: { lang: 'fr' } })
    .subscribe(() => {});
  });

  it('defaults to JSON payloads', () => {
    mock.post('/api/v1/subject', (req, res) => {
      expect(req.header('Content-Type')).toEqual('application/json');
      expect(req.body()).toEqual(JSON.stringify({ foo: 'bar', fizz: 'buzz' }));
      return res.status(200);
    });

    r.post('/api/v1/subject', { data: { foo: 'bar', fizz: 'buzz' } })
    .subscribe(() => {});
  });

  it('accepts custom headers through an object', () => {
    mock.get('/api/v1/user/42', (req, res) => {
      expect(req.header('Authorization')).toEqual('Bearer 0000');
      return res.status(200);
    });

    r.get('/api/v1/user/42', { headers: { Authorization: 'Bearer 0000' } })
    .subscribe(() => {});
  });
});
