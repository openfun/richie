import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Button } from 'components/Button';
import { TextField } from 'components/Form';
import { DashboardBox } from '../DashboardBox';
import { DashboardCard } from './index';

export default {
  title: 'Components/DashboardCard',
  component: DashboardCard,
} as ComponentMeta<typeof DashboardCard>;

const Template: ComponentStory<typeof DashboardCard> = (args) => (
  <div style={{ width: '600px' }}>
    <DashboardCard {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  header: 'Billing Addresses',
  children: <TextField id="default" label="Country" />,
  footer: <Button color="primary">Update</Button>,
};

export const WithBoxes = Template.bind({});
WithBoxes.args = {
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
};
