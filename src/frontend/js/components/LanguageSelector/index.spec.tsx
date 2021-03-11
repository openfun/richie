import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { IntlProvider } from 'react-intl';

import LanguageSelector from '.';

describe('<LanguageSelector />', () => {
  it('shows a dropdown menu that allows the user to change languages', () => {
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

    const button = screen.getByRole('button', {
      name: 'Select a language: Français',
    });

    userEvent.click(button);

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
});
