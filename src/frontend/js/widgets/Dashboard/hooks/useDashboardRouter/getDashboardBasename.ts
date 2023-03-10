/**
 * Base url of richie starts by the active locale,
 * Return the basename of the Dashboard according to the active locale.
 * @param locale
 * @returns
 */
export const getDashboardBasename = (locale: string) => {
  return `/${locale.split(/[-_]/)[0]}/dashboard`;
};
