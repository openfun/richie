import { render, screen } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { IntlProvider, createIntl } from 'react-intl';
import { faker } from '@faker-js/faker';
import { ContractFactory } from 'utils/test/factories/joanie';
import { DEFAULT_DATE_FORMAT } from 'hooks/useDateFormat';
import ContractStatus from '.';

describe('<ContractStatus />', () => {
  const Wrapper = ({ children }: PropsWithChildren) => {
    return <IntlProvider locale="en">{children}</IntlProvider>;
  };
  it('should display status for unsigned contract', () => {
    render(
      <Wrapper>
        <ContractStatus
          contract={ContractFactory({
            student_signed_on: null,
            organization_signed_on: null,
          }).one()}
        />
      </Wrapper>,
    );

    expect(
      screen.queryByText('You have to sign this training contract to access your training.'),
    ).toBeInTheDocument();

    expect(screen.queryByText(/You signed this training contract/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/The organization has signed this training contract./),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'You cannot download your training contract until it had been signed by the organization.',
      ),
    ).not.toBeInTheDocument();
  });

  it('should display status for a contract signed by the studdent', () => {
    const intl = createIntl({ locale: 'en' });
    const studentSignedOn = faker.date.past().toISOString();
    render(
      <Wrapper>
        <ContractStatus
          contract={ContractFactory({
            student_signed_on: studentSignedOn,
            organization_signed_on: null,
          }).one()}
        />
      </Wrapper>,
    );

    expect(
      screen.queryByText(
        `You signed this training contract. Signed on ${intl.formatDate(studentSignedOn, {
          ...DEFAULT_DATE_FORMAT,
        })}`,
        { exact: false },
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        'You cannot download your training contract until it had been signed by the organization.',
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByText('You have to sign this training contract to access your training.'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/The organization has signed this training contract./),
    ).not.toBeInTheDocument();
  });

  it('should display status for a contract signed by the studdent and the organization', () => {
    const intl = createIntl({ locale: 'en' });
    const studentSignedOn = faker.date.past().toISOString();
    const organizationSignedOn = faker.date.past().toISOString();
    render(
      <Wrapper>
        <ContractStatus
          contract={ContractFactory({
            student_signed_on: studentSignedOn,
            organization_signed_on: organizationSignedOn,
          }).one()}
        />
      </Wrapper>,
    );

    expect(
      screen.queryByText(
        `You signed this training contract. Signed on ${intl.formatDate(studentSignedOn, {
          ...DEFAULT_DATE_FORMAT,
        })}`,
      ),
    ).toBeInTheDocument();
    // The organization has signed this training contract. Signed on {date}
    expect(
      screen.queryByText(
        `The organization has signed this training contract. Signed on ${intl.formatDate(
          organizationSignedOn,
          {
            ...DEFAULT_DATE_FORMAT,
          },
        )}`,
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        'You cannot download your training contract until it had been signed by the organization.',
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('You have to sign this training contract to access your training.'),
    ).not.toBeInTheDocument();
  });
});
