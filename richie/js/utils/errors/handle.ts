// Generic error handler to be called whenever we need to do error reporting throughout the app
// For now only logs the error but should upload the errors to something like Sentry later on
// tslint:disable:no-console
export const handle = (error: Error) => {
  console.error(error);
};
