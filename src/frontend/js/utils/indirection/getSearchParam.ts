/**
 * Layer of indirection to facilitate testing of code that depends on search params.
 * @param paramName name of the SearchParam to extract from the URL.
 */
export const getSearchParam = (paramName: string) =>
  new URLSearchParams(new URL(window.location.href).search).get(paramName);
