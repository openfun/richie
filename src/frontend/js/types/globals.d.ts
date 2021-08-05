import { CommonDataProps } from 'types/commonDataProps';

declare global {
  const RICHIE_VERSION: string;
  interface Window {
    __richie_frontend_context__: CommonDataProps;
    __RICHIE__: () => Promise<void>;
  }
}
