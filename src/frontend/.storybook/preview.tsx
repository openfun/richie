import { useState } from 'react';
import { IntlProvider } from 'react-intl';
import { CunninghamProvider } from '@openfun/cunningham-react';
import { Preview } from '@storybook/react-webpack5';
import { useAsyncEffect } from 'hooks/useAsyncEffect';
import frMessages from 'translations/fr-FR.json';
import './__mocks__/utils/context';

const messages: Record<string, Record<string, string>> = {
  en: {},
  'fr-FR': frMessages,
};

const IconsWrapper = ({ children }: { children: React.ReactNode }) => {
  const [symbols, setSymbols] = useState('');

  useAsyncEffect(async () => {
    const response = await fetch('/icons.html');
    const body = await response.text();
    setSymbols(body);
  }, []);

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: symbols }} />
      {children}
    </div>
  );
};

const preview: Preview = {
  globalTypes: {
    locale: {
      name: 'Locale',
      description: 'Internationalization locale',
      defaultValue: 'en',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'fr-FR', title: 'Français' },
        ],
        showName: true,
      },
    },
  },
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const locale = context.globals.locale || 'en';
      return (
        <IntlProvider locale={locale} messages={messages[locale]}>
          <IconsWrapper>
            <CunninghamProvider>
              <Story />
            </CunninghamProvider>
          </IconsWrapper>
        </IntlProvider>
      );
    },
  ],
};

export default preview;
