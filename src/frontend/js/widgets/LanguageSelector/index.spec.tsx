import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { HistoryProvider } from 'hooks/useHistory';
import { render } from 'utils/test/render';
import LanguageSelector from '.';

jest.mock('utils/indirection/window', () => ({
  location: {
    assign: jest.fn(),
    replace: jest.fn(),
    search: '?args=0',
  },
}));

describe('<LanguageSelector />', () => {
  it('shows a dropdown menu that allows the user to change languages', async () => {
    const languages = {
      en: {
        code: 'en',
        name: 'Anglais',
        url: '/switch/to/en/',
      },
      fr: {
        code: 'fr',
        name: 'Français',
        url: '/switch/to/fr/',
      },
    };

    render(
      <IntlProvider locale="en">
        <LanguageSelector currentLanguage="fr" languages={languages} />
      </IntlProvider>,
      { wrapper: null },
    );

    const button = screen.getByLabelText('Select a language:', {
      selector: 'button',
    });

    await userEvent.click(button);

    screen.getByRole('listbox', { name: 'Select a language:' });
    screen.getByRole('option', { name: 'Anglais' });
    screen.getByRole('link', { name: 'Anglais' });
    expect(screen.getByRole('link', { name: 'Français' }).title).toEqual(
      'Switch to Français (currently selected)',
    );
  });

  it('should preserve location search parameters if there are any', async () => {
    const languages = {
      en: {
        code: 'en',
        name: 'Anglais',
        url: '/switch/to/en/',
      },
      fr: {
        code: 'fr',
        name: 'Français',
        url: '/switch/to/fr/',
      },
    };

    render(
      <HistoryProvider>
        <IntlProvider locale="en">
          <LanguageSelector currentLanguage="fr" languages={languages} />
        </IntlProvider>
      </HistoryProvider>,
      { wrapper: null },
    );
    const button = screen.getByLabelText('Select a language:', {
      selector: 'button',
    });

    await userEvent.click(button);

    const link = await screen.findByRole('link', { name: 'Anglais' });
    expect(link).toHaveAttribute('href', '/switch/to/en/?args=0');
    expect(link.title).toEqual('Switch to Anglais');
  });
});
