/**
 * Common data properties that are passed by the backend to all React components as they are
 * instantiated.
 */
export interface CommonDataProps {
  context: {
    assets: {
      icons: string;
    };
  };
}
