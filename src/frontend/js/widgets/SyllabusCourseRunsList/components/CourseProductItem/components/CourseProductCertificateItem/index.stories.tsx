import { Meta, StoryObj } from '@storybook/react';
import { CertificationDefinitionFactory, OrderLiteFactory } from 'utils/test/factories/joanie';
import JoanieApiProvider from 'contexts/JoanieApiContext';
import { StorybookHelper } from 'utils/StorybookHelper';
import CertificateItem from '.';

export default {
  component: CertificateItem,
  parameters: {
    docs: {
      source: {
        code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
      },
    },
  },
  args: {
    certificateDefinition: CertificationDefinitionFactory().one(),
    order: OrderLiteFactory({
      certificate_id: "Demo User's certificate for cours Demo Course",
    }).one(),
  },
  render: (args) => {
    return StorybookHelper.wrapInApp(
      <JoanieApiProvider>
        <CertificateItem {...args} />
      </JoanieApiProvider>,
    );
  },
} as Meta<typeof CertificateItem>;

type Story = StoryObj<typeof CertificateItem>;

export const Default: Story = {};
