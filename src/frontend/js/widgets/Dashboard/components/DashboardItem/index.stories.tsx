import { Meta, StoryObj } from '@storybook/react';
import { DashboardItem, DEMO_IMAGE_URL } from './index';

export default {
  component: DashboardItem,
  args: {
    code: 'Ref. 30194',
    title: 'Machine learning in Python with sckit-learn',
    footer: (
      <>
        <div>Left</div>
        <div>Right</div>
      </>
    ),
  },
} as Meta<typeof DashboardItem>;

type Story = StoryObj<typeof DashboardItem>;

export const Default: Story = {};

export const WithImage: Story = {
  args: { imageUrl: DEMO_IMAGE_URL },
};
export const WithMore: Story = {
  args: {
    imageUrl: DEMO_IMAGE_URL,
    more: (
      <>
        <li>
          <div className="selector__list__link">Copy</div>
        </li>
        <li>
          <div className="selector__list__link">Duplicate</div>
        </li>
        <li>
          <div className="selector__list__link">Delete</div>
        </li>
      </>
    ),
  },
};
