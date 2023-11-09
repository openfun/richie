import { Meta, StoryObj } from '@storybook/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { CredentialOrderFactory, TargetCourseFactory } from 'utils/test/factories/joanie';
import { StorybookHelper } from 'utils/StorybookHelper';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { UserFactory } from 'utils/test/factories/richie';
import CourseRunItem from '.';

export default {
  component: CourseRunItem,
  parameters: {
    docs: {
      source: {
        code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
      },
    },
  },
  render: (args) => {
    return StorybookHelper.wrapInApp(
      <QueryClientProvider client={createTestQueryClient({ user: UserFactory().one() })}>
        <CourseRunItem {...args} />
      </QueryClientProvider>,
    );
  },
} as Meta<typeof CourseRunItem>;

type Story = StoryObj<typeof CourseRunItem>;

export const Default: Story = {
  args: {
    targetCourse: TargetCourseFactory().one(),
    order: CredentialOrderFactory({
      certificate_id: "Demo User's certificate for cours Demo Course",
    }).one(),
  },
};
