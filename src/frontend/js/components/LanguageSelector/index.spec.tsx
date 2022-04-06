import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { HistoryProvider } from 'data/useHistory';
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
    );

    const button = screen.getByLabelText('Select a language: Français', {
      selector: 'button',
    });

    await userEvent.click(button);

    screen.getByRole('listbox', { name: 'Select a language:' });
    screen.getByRole('option', { name: 'Switch to Anglais' });
    screen.getByRole('link', { name: 'Switch to Anglais' });
    screen.getByRole('option', {
      name: 'Switch to Français (currently selected)',
    });
    screen.getByRole('link', {
      name: 'Switch to Français (currently selected)',
    });
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
    );

    const button = screen.getByLabelText('Select a language: Français', {
      selector: 'button',
    });

    await userEvent.click(button);
    const link = screen.getByRole('link', { name: 'Switch to Anglais' });
    expect(link).toHaveAttribute('href', '/switch/to/en/?args=0');
  });
});
