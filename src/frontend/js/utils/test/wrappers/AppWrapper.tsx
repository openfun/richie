import { PropsWithChildren } from 'react';
import { CunninghamProvider } from '@openfun/cunningham-react';
import { HistoryContext } from 'hooks/useHistory';
import { makeHistoryOf } from '../makeHistoryOf';
import { IntlWrapper } from './IntlWrapper';
import { ReactQueryWrapper } from './ReactQueryWrapper';
import { AppWrapperProps } from './types';

const AppWrapper = ({
  children,
  intlOptions,
  queryOptions,
  historyOptions = makeHistoryOf([]),
}: PropsWithChildren<AppWrapperProps>) => {
  return (
    <CunninghamProvider>
      <HistoryContext.Provider value={historyOptions}>
        <IntlWrapper {...intlOptions}>
          <ReactQueryWrapper {...queryOptions}>{children}</ReactQueryWrapper>
        </IntlWrapper>
      </HistoryContext.Provider>
    </CunninghamProvider>
  );
};

export default AppWrapper;
