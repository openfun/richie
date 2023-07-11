import { CommonDataProps } from 'types/commonDataProps';
import { Maybe } from 'types/utils';

declare global {
  const RICHIE_VERSION: string;
  interface Window {
    CMS: Maybe<{
      config: {
        auth: boolean;
        PropertyKey?: any;
        mode?: string;
      };
      Plugin: {
        _initializeTree: Function;
      };
      PropertyKey?: any;
    }>;
    __richie_frontend_context__: CommonDataProps;
    __RICHIE__: () => Promise<void>;
  }
}
