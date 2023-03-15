import { useState } from 'react';
import { IntlProvider } from 'react-intl';
import './__mocks__/utils/context';
import { useAsyncEffect } from 'hooks/useAsyncEffect';

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
        <Story />
      </IconsWrapper>
    </IntlProvider>
  ),
];
