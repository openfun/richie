import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Button } from 'components/Button';
import { DashboardBox } from './index';

export default {
  title: 'Components/DashboardBox',
  component: DashboardBox,
} as ComponentMeta<typeof DashboardBox>;

const Template: ComponentStory<typeof DashboardBox> = (args) => (
  <div style={{ width: '600px' }}>
    <DashboardBox {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
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
};

export const NoHeader = Template.bind({});
NoHeader.args = {
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
};

export const NoFooter = Template.bind({});
NoFooter.args = {
  header: <>Address used by default</>,
  children: (
    <div>
      <div>Home</div>
      <strong>Pierre Léger</strong>
      <p>21 rue du pavillon - 78130 Chapter ( France )</p>
    </div>
  ),
};
