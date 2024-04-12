import { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RouterWrapper } from 'utils/test/wrappers/RouterWrapper';
import Tabs from './index';

export default {
  component: Tabs,
} as Meta<typeof Tabs>;

type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => {
    const [tabContent, setTabContent] = useState('This is the first tab content');
    return (
      <RouterWrapper>
        <Tabs initialActiveTabName="first-tab">
          <Tabs.Tab name="first-tab" onClick={() => setTabContent('This is the first tab content')}>
            First tab
          </Tabs.Tab>
          <Tabs.Tab
            name="second-tab"
            onClick={() => setTabContent('This is the second tab content')}
          >
            Second tab
          </Tabs.Tab>
        </Tabs>
        {tabContent}
      </RouterWrapper>
    );
  },
};
