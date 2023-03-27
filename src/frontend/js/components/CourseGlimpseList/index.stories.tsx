import { ComponentMeta, ComponentStory } from '@storybook/react';
import { RichieContextFactory, CourseFactory } from 'utils/test/factories/richie';
import { CourseGlimpseList } from '.';

export default {
  title: 'Components/CourseGlimpseList',
  component: CourseGlimpseList,
} as ComponentMeta<typeof CourseGlimpseList>;

const Template: ComponentStory<typeof CourseGlimpseList> = (args) => (
  <CourseGlimpseList {...args} />
);

export const RichieCourseList = Template.bind({});
RichieCourseList.args = {
  context: RichieContextFactory().generate(),
  courses: CourseFactory.generate(10),
  meta: {
    count: 10,
    offset: 0,
    total_count: 100,
  },
};
