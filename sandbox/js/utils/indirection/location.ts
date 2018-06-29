// Layer of indirection to facilitate testing of code that would use location facilities
export const location = {
  setHref: (url: string) => (window.location.href = url),
};
