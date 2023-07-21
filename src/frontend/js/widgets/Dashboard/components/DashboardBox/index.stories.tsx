import { Meta, StoryObj } from '@storybook/react';
import { Button } from '@openfun/cunningham-react';
import { DashboardBox } from './index';

export default {
  component: DashboardBox,
  render: (args) => (
    <div style={{ width: '600px' }}>
      <DashboardBox {...args} />
    </div>
  ),
} as Meta<typeof DashboardBox>;

type Story = StoryObj<typeof DashboardBox>;

export const Default: Story = {
  args: {
    header: <>Address used by default</>,
    children: (
      <div>
        <div>Home</div>
        <strong>Pierre Léger</strong>
        <p>21 rue du pavillon - 78130 Chapter ( France )</p>
      </div>
    ),
    footer: (
      <>
        <Button color="primary">Delete</Button>
        <Button color="primary">Update</Button>
      </>
    ),
  },
};

export const NoHeader: Story = {
  args: {
    children: (
      <div>
        <div>Home</div>
        <strong>Pierre Léger</strong>
        <p>21 rue du pavillon - 78130 Chapter ( France )</p>
      </div>
    ),
    footer: (
      <>
        <Button color="primary">Delete</Button>
        <Button color="primary">Update</Button>
      </>
    ),
  },
};

export const NoFooter: Story = {
  args: {
    header: <>Address used by default</>,
    children: (
      <div>
        <div>Home</div>
        <strong>Pierre Léger</strong>
        <p>21 rue du pavillon - 78130 Chapter ( France )</p>
      </div>
    ),
  },
};
