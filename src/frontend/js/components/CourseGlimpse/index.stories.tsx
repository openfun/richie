import { Meta, StoryObj } from '@storybook/react';
import { RichieContextFactory, CourseLightFactory } from 'utils/test/factories/richie';
import { getCourseGlimpseProps, CourseGlimpse } from 'components/CourseGlimpse';

export default {
  component: CourseGlimpse,
} as Meta<typeof CourseGlimpse>;

type Story = StoryObj<typeof CourseGlimpse>;

export const RichieCourse: Story = {
  args: {
    context: RichieContextFactory().one(),
    course: getCourseGlimpseProps(CourseLightFactory().one()),
  },
};
