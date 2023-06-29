import { Meta, StoryObj } from '@storybook/react';
import { QueryClientProvider } from '@tanstack/react-query';
import fetchMock from 'fetch-mock';
import { StorybookHelper } from 'utils/StorybookHelper';
import { AddressFactory, ProductFactory } from 'utils/test/factories/joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { UserFactory } from 'utils/test/factories/richie';
import CourseProductItem from '.';

export default {
  component: CourseProductItem,
  parameters: {
    docs: {
      source: {
        code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
      },
    },
  },
  args: {
    address: AddressFactory().one(),
  },
  render: (args) => {
    fetchMock.get('http://localhost:8071/api/v1.0/credit-cards/', []);
    fetchMock.get('http://localhost:8071/api/v1.0/orders/', []);
    fetchMock.get('http://localhost:8071/api/v1.0/addresses/', []);
    fetchMock.get(
      'http://localhost:8071/api/v1.0/products/AAA/?course=BBB',
      ProductFactory().one(),
    );
    return StorybookHelper.wrapInApp(
      <QueryClientProvider client={createTestQueryClient({ user: UserFactory().one() })}>
        <CourseProductItem {...args} />
      </QueryClientProvider>,
    );
  },
} as Meta<typeof CourseProductItem>;

type Story = StoryObj<typeof CourseProductItem>;

export const Default: Story = {
  args: {
    productId: 'AAA',
    courseCode: 'BBB',
  },
};
