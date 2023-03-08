import { ComponentMeta, ComponentStory } from '@storybook/react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter } from 'react-router-dom';
import SettingsLink from 'components/SettingsLink';

export default {
  title: 'Components/SettingsLink',
  component: SettingsLink,
} as ComponentMeta<typeof SettingsLink>;

const Template: ComponentStory<typeof SettingsLink> = (args) => {
  return (
    <IntlProvider locale="en">
      <BrowserRouter>
        <SettingsLink {...args} />
      </BrowserRouter>
    </IntlProvider>
  );
};

export const Default = Template.bind({});
Default.args = {};
