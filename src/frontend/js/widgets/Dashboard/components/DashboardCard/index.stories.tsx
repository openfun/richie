import { Meta, StoryObj } from '@storybook/react-webpack5';
import { Button } from '@openfun/cunningham-react';
import { DashboardBox } from '../DashboardBox';
import { DashboardCard } from './index';

export default {
  component: DashboardCard,
  render: (args) => (
    <div style={{ width: '600px' }}>
      <DashboardCard {...args} />
    </div>
  ),
} as Meta<typeof DashboardCard>;

type Story = StoryObj<typeof DashboardCard>;

export const Default: Story = {
  args: {
    header: 'Billing Addresses',
    children: (
      <div>
        <div>
          <div>Home</div>
          <strong>Pierre Léger</strong>
          <p>21 rue du pavillon - 78130 Chapter ( France )</p>
        </div>
      </div>
    ),
    footer: <Button color="primary">Update</Button>,
  },
};

export const WithBoxes: Story = {
  args: {
    header: 'Billing Addresses',
    children: (
      <div>
        <DashboardBox
          header={<>Address used by default</>}
          footer={
            <>
              <Button color="primary">Remove</Button>
              <Button color="primary">Edit</Button>
            </>
          }
        >
          <div>
            <div>Home</div>
            <strong>Pierre Léger</strong>
            <p>21 rue du pavillon - 78130 Chapter ( France )</p>
          </div>
        </DashboardBox>
      </div>
    ),
  },
};

export const NotExpanded: Story = {
  args: {
    header: 'Not expanded',
    defaultExpanded: false,
    children: (
      <div>
        <div>
          <div>Home</div>
          <strong>Pierre Léger</strong>
          <p>21 rue du pavillon - 78130 Chapter ( France )</p>
        </div>
      </div>
    ),
  },
};
