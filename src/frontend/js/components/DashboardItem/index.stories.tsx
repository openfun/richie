import { ComponentMeta, ComponentStory } from '@storybook/react';
import { DashboardItem, DEMO_IMAGE_URL } from './index';

export default {
  title: 'Components/Dashboard/Item',
  component: DashboardItem,
  args: {
    code: 'Ref. 30194',
    title: 'Machine learning in Python with sckit-learn',
    imageUrl: DEMO_IMAGE_URL,
    footer: (
      <>
        <div>Left</div>
        <div>Right</div>
      </>
    ),
  },
} as ComponentMeta<typeof DashboardItem>;

const Template: ComponentStory<typeof DashboardItem> = (args) => <DashboardItem {...args} />;

export const Default = Template.bind({});
