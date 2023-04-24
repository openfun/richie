import { Meta, StoryObj } from '@storybook/react';
import { DashboardItemCertificate } from 'widgets/Dashboard/components/DashboardItem/Certificate/index';
import { StorybookHelper } from 'utils/StorybookHelper';
import { Certificate } from 'types/Joanie';
import { CertificateFactory } from 'utils/test/factories/joanie';

export default {
  title: 'Widgets/Dashboard/Certificate',
  component: DashboardItemCertificate,
  parameters: {
    docs: {
      source: {
        code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
      },
    },
  },
  render: (args) => StorybookHelper.wrapInApp(<DashboardItemCertificate {...args} />),
} as Meta<typeof DashboardItemCertificate>;

type Story = StoryObj<typeof DashboardItemCertificate>;

const certificate: Certificate = CertificateFactory().one();

export const Default: Story = {
  args: {
    certificate,
  },
};

export const NoCertif: Story = {
  args: {
    certificateDefinition: certificate.certificate_definition,
  },
};
