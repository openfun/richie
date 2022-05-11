// The purpose of this function is to get the basename of the dashboard context, the basename depending of the locale
const getBasename = (locale: string) => {
  return `${locale.split(/[-_]/)[0]}/dashboard`;
};

export default getBasename;
