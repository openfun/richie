import { RichieContextFactory } from 'utils/test/factories/richie';

let context = {
  joanie_backend: {
    endpoint: 'http://localhost:8071',
  },
  authentication: {
    backend: 'dummy',
    endpoint: 'http://localhost:8073',
  },
};

(window as any).__richie_frontend_context__ = {
  context: RichieContextFactory(context).one(),
};
