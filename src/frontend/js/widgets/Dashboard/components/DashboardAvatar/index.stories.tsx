import { ComponentMeta, ComponentStory } from '@storybook/react';
import { UserFactory } from 'utils/test/factories/richie';
import { DashboardAvatar } from '.';

export default {
  title: 'Components/Dashboard/DashboardAvatar',
  component: DashboardAvatar,
} as ComponentMeta<typeof DashboardAvatar>;

const Template: ComponentStory<typeof DashboardAvatar> = (args) => <DashboardAvatar {...args} />;

export const Default = Template.bind({});
const user = UserFactory.generate();
Default.args = {
  user,
};
