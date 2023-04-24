import { Meta, StoryObj } from '@storybook/react';
import { RichieContextFactory, CourseLightFactory } from 'utils/test/factories/richie';
import { CourseGlimpseList } from '.';

export default {
  component: CourseGlimpseList,
} as Meta<typeof CourseGlimpseList>;

type Story = StoryObj<typeof CourseGlimpseList>;

export const RichieCourseList: Story = {
  args: {
    context: RichieContextFactory().generate(),
    courses: CourseLightFactory.generate(10),
    meta: {
      count: 10,
      offset: 0,
      total_count: 100,
    },
  },
};
