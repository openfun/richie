import { Meta, StoryObj } from '@storybook/react';
import { Button } from '@openfun/cunningham-react';
import { TextField } from 'components/Form';
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
    children: <TextField id="default" label="Country" />,
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
