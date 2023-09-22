import { Meta, StoryObj } from '@storybook/react';
import { CunninghamProvider } from '@openfun/cunningham-react';
import { StorybookHelper } from 'utils/StorybookHelper';
import { DashboardAddressesManagement } from './index';

export default {
  component: DashboardAddressesManagement,
  parameters: {
    docs: {
      source: {
        code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
      },
    },
  },
  render: (args) => {
    return StorybookHelper.wrapInApp(
      <div style={{ width: '600px' }}>
        <CunninghamProvider>
          <DashboardAddressesManagement {...args} />
        </CunninghamProvider>
      </div>,
    );
  },
} as Meta<typeof DashboardAddressesManagement>;

type Story = StoryObj<typeof DashboardAddressesManagement>;

export const Default: Story = {};
