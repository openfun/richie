import { handle } from 'utils/errors/handle';

/**
 * Retrieve the context provided by the backend from `__richie_frontend_context__`
 */
const context = window.__richie_frontend_context__?.context;

if (!context) {
  const error = new Error('Richie frontend context is not defined.');
  handle(error);
  throw error;
}

export default context;
