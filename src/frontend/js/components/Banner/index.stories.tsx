import { ComponentMeta, ComponentStory } from '@storybook/react';
import Banner, { BannerType } from './index';

export default {
  title: 'Components/Banner',
  component: Banner,
  args: {
    message: 'Hello world',
  },
} as ComponentMeta<typeof Banner>;

const Template: ComponentStory<typeof Banner> = (args) => <Banner {...args} />;

export const Error = Template.bind({});
Error.args = {
  type: BannerType.ERROR,
};

export const Info = Template.bind({});
Info.args = {
  type: BannerType.INFO,
};

export const Success = Template.bind({});
Success.args = {
  type: BannerType.SUCCESS,
};

export const Warning = Template.bind({});
Warning.args = {
  type: BannerType.WARNING,
};
