import { IntlProvider } from 'react-intl';
import { render, screen } from '@testing-library/react';
import { ProductType } from 'types/Joanie';
import { CertificateFactory } from 'utils/test/factories/joanie';
import CertificateStatus, { CertificateStatusProps } from '.';

describe('<CertificateStatus/>', () => {
  const Wrapper = ({ certificate, productType }: CertificateStatusProps) => (
    <IntlProvider locale="en">
      <CertificateStatus certificate={certificate} productType={productType} />
    </IntlProvider>
  );

  it('should display message for issued certificate.', () => {
    const certificate = CertificateFactory({
      issued_on: new Date('01/01/2021').toISOString(),
    }).one();
    render(<Wrapper certificate={certificate} productType={ProductType.CERTIFICATE} />);
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
    render(<Wrapper productType={ProductType.CERTIFICATE} />);

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
    render(<Wrapper productType={ProductType.CREDENTIAL} />);
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
