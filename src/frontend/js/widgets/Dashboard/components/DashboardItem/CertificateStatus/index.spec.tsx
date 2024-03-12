import { screen } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { ProductType } from 'types/Joanie';
import { CertificateFactory } from 'utils/test/factories/joanie';
import { render } from 'utils/test/render';
import { IntlWrapper } from 'utils/test/wrappers/IntlWrapper';
import CertificateStatus from '.';

describe('<CertificateStatus/>', () => {
  it('should display message for issued certificate.', () => {
    const certificate = CertificateFactory({
      issued_on: new Date('01/01/2021').toISOString(),
    }).one();
    render(<CertificateStatus certificate={certificate} productType={ProductType.CERTIFICATE} />, {
      wrapper: ({ children }: PropsWithChildren) => <IntlWrapper>{children}</IntlWrapper>,
    });
    expect(screen.getByText('Issued on Jan 01, 2021')).toBeInTheDocument();

    expect(
      screen.queryByText(
        'When you pass your exam, you will be able to download your certificate here.',
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'When all your courses have been passed, you will be able to download your certificate here.',
      ),
    ).not.toBeInTheDocument();
  });

  it('should display message for no certificate of product type certificate.', () => {
    render(<CertificateStatus productType={ProductType.CERTIFICATE} />, {
      wrapper: ({ children }: PropsWithChildren) => <IntlWrapper>{children}</IntlWrapper>,
    });

    expect(
      screen.getByText(
        'When you pass your exam, you will be able to download your certificate here.',
      ),
    ).toBeInTheDocument();

    expect(screen.queryByText('Issued on', { exact: false })).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'When all your courses have been passed, you will be able to download your certificate here.',
      ),
    ).not.toBeInTheDocument();
  });

  it('should display message for no certificate of product type credential.', () => {
    render(<CertificateStatus productType={ProductType.CREDENTIAL} />, {
      wrapper: ({ children }: PropsWithChildren) => <IntlWrapper>{children}</IntlWrapper>,
    });
    expect(
      screen.getByText(
        'When all your courses have been passed, you will be able to download your certificate here.',
      ),
    ).toBeInTheDocument();

    expect(screen.queryByText('Issued on', { exact: false })).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'When you pass your exam, you will be able to download your certificate here.',
      ),
    ).not.toBeInTheDocument();
  });
});
