import { useState } from 'react';
import { IntlProvider } from 'react-intl';
import { CunninghamProvider } from '@openfun/cunningham-react';
import { useAsyncEffect } from 'hooks/useAsyncEffect';
import './__mocks__/utils/context';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

const IconsWrapper = (props) => {
  const [symbols, setSymbols] = useState('');

  useAsyncEffect(async () => {
    const response = await fetch('/icons.html');
    const body = await response.text();
    setSymbols(body);
  }, []);

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: symbols }} />
      {props.children}
    </div>
  );
};

export const decorators = [
  (Story) => (
    <IntlProvider locale="en">
      <IconsWrapper>
        <CunninghamProvider>
          <Story />
        </CunninghamProvider>
      </IconsWrapper>
    </IntlProvider>
  ),
];
