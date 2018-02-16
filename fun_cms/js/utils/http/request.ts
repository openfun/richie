import includes from 'lodash-es/includes';
import partial from 'lodash-es/partial';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

import '../../utils/observable/extensions';
import formatQueryString from './formatQueryString';

export interface RequestFormattedResponse {
  headers: string;
  response: any;
  status: number;
  statusText: string;
}

export interface RequestOptions {
  headers?: { [name: string]: string };
  params?: { [key: string]: string | string[] };
  data?: object | string;
}

function request(
  method: string,
  url: string,
  { headers, params, data }: RequestOptions = {},
): Observable<RequestFormattedResponse | Error> {
  return Observable.create((observer: Observer<object>) => {
    const xhr = new XMLHttpRequest();

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status) {
          const formattedResponse: RequestFormattedResponse = {
            headers: xhr.getAllResponseHeaders(),
            response: xhr.getResponseHeader('Content-Type') === 'application/json' ?
              JSON.parse(xhr.responseText) : xhr.responseText,
            status: xhr.status,
            statusText: xhr.statusText,
          };

          // Successful response codes
          if (includes([ 200, 201, 202 ], xhr.status)) {
            observer.next(formattedResponse);
          } else {
            // Other response codes mean there was an error of some kind
            observer.error(formattedResponse);
          }
        } else {
          observer.error(new Error('Request failed to launch.'));
        }
        // Whatever happened, complete the observable sequence
        observer.complete();
      }
    };

    xhr.open(method, url + (formatQueryString(params) || ''));

    // Set custom headers
    if (headers) {
      Object.keys(headers).forEach((name) => {
        xhr.setRequestHeader(name, headers[name]);
      });
    }
    // Default to JSON if no Content-Type is provided
    if (!(headers && headers['Content-Type'])) {
      xhr.setRequestHeader('Content-Type', 'application/json');
    }

    let payload;
    switch (typeof data) {
      case 'string':
        payload = data;
        break;

      case 'object':
        payload = JSON.stringify(data);
        break;
    }
    xhr.send(payload || null);
  });
}

// For some reason TS does not infer a correct typing from _.partial, which is why we force it ourselves.
type requestMethod = (url: string, options?: RequestOptions) => Observable<RequestFormattedResponse | Error>;
export let r: {
  delete: requestMethod;
  get: requestMethod;
  post: requestMethod;
  put: requestMethod;
} = {
  delete: partial(request, 'DELETE'),
  get: partial(request, 'GET'),
  post: partial(request, 'POST'),
  put: partial(request, 'PUT'),
};
