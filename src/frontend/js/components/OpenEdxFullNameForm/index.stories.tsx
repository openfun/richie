import { Meta, StoryObj } from '@storybook/react-webpack5';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';
import OpenEdxFullNameForm from '.';

export default {
  component: OpenEdxFullNameForm,
  render: () => (
    <BaseJoanieAppWrapper>
      <OpenEdxFullNameForm />
    </BaseJoanieAppWrapper>
  ),
} as Meta<typeof OpenEdxFullNameForm>;

type Story = StoryObj<typeof OpenEdxFullNameForm>;

export const Default: Story = {};
