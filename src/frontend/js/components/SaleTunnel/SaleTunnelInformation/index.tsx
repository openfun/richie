import { defineMessages, FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import { AddressSelector } from 'components/SaleTunnel/AddressSelector';
import { PaymentScheduleGrid } from 'components/PaymentScheduleGrid';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import OpenEdxFullNameForm from 'components/OpenEdxFullNameForm';
import { useSession } from 'contexts/SessionContext';
import useOpenEdxProfile from 'hooks/useOpenEdxProfile';
import { usePaymentSchedule } from 'hooks/usePaymentSchedule';
import { Spinner } from 'components/Spinner';
import WithdrawRightCheckbox from 'components/SaleTunnel/WithdrawRightCheckbox';
import { ProductType } from 'types/Joanie';
import { Input, Radio, Select, Checkbox } from '@openfun/cunningham-react';
import { Stepper, Step, StepLabel } from '@mui/material';
import { useState } from 'react';

const messages = defineMessages({
  title: {
    id: 'components.SaleTunnel.Information.title',
    description: 'Title for the information section',
    defaultMessage: 'Information',
  },
  description: {
    id: 'components.SaleTunnel.Information.description',
    description: 'Description of the information section',
    defaultMessage: 'Those information will be used for billing',
  },
  fullNameLabel: {
    id: 'components.SaleTunnel.Information.fullNameLabel',
    description: 'Label for the full name input',
    defaultMessage: 'Full name',
  },
  paymentSchedule: {
    id: 'components.SaleTunnel.Information.paymentSchedule',
    description: 'Title for the payment schedule section',
    defaultMessage: 'Payment schedule',
  },
  totalInfo: {
    id: 'components.SaleTunnel.Information.total.info',
    description: 'Information about the total amount',
    defaultMessage: 'You will then pay on the secured platform of our payment provider.',
  },
  totalLabel: {
    id: 'components.SaleTunnel.Information.total.label',
    description: 'Label for the total amount',
    defaultMessage: 'Total',
  },
  emailLabel: {
    id: 'components.SaleTunnel.Information.email.label',
    description: 'Label for the email',
    defaultMessage: 'Account email',
  },
  emailInfo: {
    id: 'components.SaleTunnel.Information.email.info',
    description: 'Info for the email',
    defaultMessage:
      'This email will be used to send you confirmation mails, it is the one you created your account with.',
  },
  purchaseTypeTitle: {
    id: 'components.SaleTunnel.Information.purchaseTypeTitle',
    description: 'Title for purchase type',
    defaultMessage: 'Select purchase type',
  },
  purchaseTypeSelect: {
    id: 'components.SaleTunnel.Information.purchaseTypeSelect',
    description: 'Label for purchase type select',
    defaultMessage: 'Purchase type',
  },
  purchaseTypeOptionSingle: {
    id: 'components.SaleTunnel.Information.purchaseTypeOptionSingle',
    description: 'Label for B2C option',
    defaultMessage: 'Single purchase (B2C)',
  },
  purchaseTypeOptionGroup: {
    id: 'components.SaleTunnel.Information.purchaseTypeOptionGroup',
    description: 'Label for B2C option',
    defaultMessage: 'Group purchase (B2B)',
  },
  stepCompany: {
    id: 'components.SaleTunnel.GroupBuyForm.stepCompany',
    defaultMessage: 'Company / Organization',
  },
  stepAdmin: {
    id: 'components.SaleTunnel.GroupBuyForm.stepAdmin',
    defaultMessage: 'Administrative follow-up',
  },
  stepBilling: {
    id: 'components.SaleTunnel.GroupBuyForm.stepBilling',
    defaultMessage: 'Billing',
  },
  stepParticipants: {
    id: 'components.SaleTunnel.GroupBuyForm.stepParticipants',
    defaultMessage: 'Participants',
  },
  stepFinancing: {
    id: 'components.SaleTunnel.GroupBuyForm.stepFinancing',
    defaultMessage: 'Financing',
  },
  companyName: { id: 'groupBuy.companyName', defaultMessage: 'Company name' },
  siret: { id: 'groupBuy.siret', defaultMessage: 'SIRET number' },
  vatNumber: { id: 'groupBuy.vatNumber', defaultMessage: 'VAT number' },
  address: { id: 'groupBuy.address', defaultMessage: 'Address' },
  postalCode: { id: 'groupBuy.postalCode', defaultMessage: 'Postal code' },
  city: { id: 'groupBuy.city', defaultMessage: 'City' },
  country: { id: 'groupBuy.country', defaultMessage: 'Country' },
  firstName: { id: 'groupBuy.firstName', defaultMessage: 'First name' },
  lastName: { id: 'groupBuy.lastName', defaultMessage: 'Last name' },
  role: { id: 'groupBuy.role', defaultMessage: 'Role' },
  email: { id: 'groupBuy.email', defaultMessage: 'Email' },
  phone: { id: 'groupBuy.phone', defaultMessage: 'Phone' },
  birthDate: { id: 'groupBuy.birthDate', defaultMessage: 'Birth date' },
  participantNumber: { id: 'groupBuy.particpantNumber', defaultMessage: 'How many participants ?' },
  addParticipant: { id: 'groupBuy.addParticipant', defaultMessage: 'Add participant' },
  cardPayment: { id: 'groupBuy.cardPayment', defaultMessage: 'Payment by credit card' },
  bankTransfer: { id: 'groupBuy.bankTransfer', defaultMessage: 'Payment by bank transfer' },
  withOrderForm: { id: 'groupBuy.withOrderForm', defaultMessage: 'With order form' },
  withoutOrderForm: { id: 'groupBuy.withoutOrderForm', defaultMessage: 'Without order form' },
  opco: { id: 'groupBuy.opc', defaultMessage: 'OPCO' },
  opcoName: { id: 'groupBuy.opcName', defaultMessage: 'OPCO name' },
  opcoAmount: { id: 'groupBuy.opcoAmount', defaultMessage: 'OPCO - Amount covered' },
  jobCenter: { id: 'groupBuy.jobCenter', defaultMessage: 'Pôle emploi' },
  jobCenterAmount: {
    id: 'groupBuy.jobCenterAmount',
    defaultMessage: 'Pôle emploi - Amount covered',
  },
  other: { id: 'groupBuy.other', defaultMessage: 'Other' },
  otherSpecify: { id: 'groupBuy.otherSpecify', defaultMessage: 'Other - specify' },
  participatingUniversities: {
    id: 'groupBuy.participatingUniversities',
    defaultMessage: 'Participating universities',
  },
});

export const SaleTunnelInformation = () => {
  const { product } = useSaleTunnelContext();
  const intl = useIntl();
  const options = [
    { label: intl.formatMessage(messages.purchaseTypeOptionSingle), value: 'b2c' },
    { label: intl.formatMessage(messages.purchaseTypeOptionGroup), value: 'b2b' },
  ];
  const [purchaseType, setPurchaseType] = useState('b2b');

  return (
    <div className="sale-tunnel__main__column sale-tunnel__information">
      <div>
        <h3 className="block-title mb-t">
          <FormattedMessage {...messages.purchaseTypeTitle} />
        </h3>
        <Select
          label={intl.formatMessage(messages.purchaseTypeSelect)}
          options={options}
          fullWidth
          value={purchaseType}
          clearable={false}
          onChange={(e) => {
            setPurchaseType(e.target.value as string);
          }}
        />
      </div>
      {purchaseType === 'b2c' && (
        <>
          <div>
            <h3 className="block-title mb-t">
              <FormattedMessage {...messages.title} />
            </h3>
            <div className="description mb-s">
              <FormattedMessage {...messages.description} />
            </div>
            <OpenEdxFullNameForm />
            <AddressSelector />
            <div className="mt-s">
              <Email />
            </div>
          </div>
          <div>
            {product.type === ProductType.CREDENTIAL && <PaymentScheduleBlock />}
            <Total />
            <WithdrawRightCheckbox />
          </div>
        </>
      )}
      {purchaseType === 'b2b' && (
        <>
          <div>
            <h3 className="block-title mb-t">
              <FormattedMessage {...messages.title} />
            </h3>
            <div className="description mb-s">
              <FormattedMessage {...messages.description} />
            </div>
          </div>
          <GroupBuyForm />
        </>
      )}
    </div>
  );
};
const Email = () => {
  const { user } = useSession();
  const { data: openEdxProfileData } = useOpenEdxProfile({
    username: user!.username,
  });

  return (
    <div className="sale-tunnel__email">
      <div className="sale-tunnel__email__top">
        <h4>
          <FormattedMessage {...messages.emailLabel} />
        </h4>
        <div className="fw-bold">{openEdxProfileData?.email}</div>
      </div>
      <div className="sale-tunnel__email__description">
        <FormattedMessage {...messages.emailInfo} />
      </div>
    </div>
  );
};

const Total = () => {
  const { product, offering, enrollment } = useSaleTunnelContext();
  const totalPrice =
    enrollment?.offerings?.[0]?.rules?.discounted_price ??
    offering?.rules.discounted_price ??
    product.price;
  return (
    <div className="sale-tunnel__total">
      <div className="sale-tunnel__total__amount mt-t" data-testid="sale-tunnel__total__amount">
        <div className="block-title">
          <FormattedMessage {...messages.totalLabel} />
        </div>
        <div className="block-title">
          <FormattedNumber value={totalPrice} style="currency" currency={product.price_currency} />
        </div>
      </div>
    </div>
  );
};

const PaymentScheduleBlock = () => {
  const { props } = useSaleTunnelContext();
  const query = usePaymentSchedule({
    course_code: props.course?.code || props.enrollment!.course_run.course.code,
    product_id: props.product.id,
  });

  if (!query.data || query.isLoading) {
    return <Spinner size="large" />;
  }

  return (
    <div className="payment-schedule">
      <h4 className="block-title mb-t">
        <FormattedMessage {...messages.paymentSchedule} />
      </h4>
      <div className="mt-t">
        <PaymentScheduleGrid schedule={query.data} />
      </div>
    </div>
  );
};

const GroupBuyForm = () => {
  const [activeStep, setActiveStep] = useState(0);

  const intl = useIntl();

  const steps = [
    intl.formatMessage(messages.stepCompany),
    intl.formatMessage(messages.stepAdmin),
    intl.formatMessage(messages.stepBilling),
    intl.formatMessage(messages.stepParticipants),
    intl.formatMessage(messages.stepFinancing),
  ];

  const [selectedPayment, setSelectedPayment] = useState('card');
  const [selectedOrganism, setSelectedOrganism] = useState('opco');
  const [studentCount, setStudentCount] = useState(1);
  const [students, setStudents] = useState(
    Array.from({ length: studentCount }, () => ({
      lastName: '',
      firstName: '',
      birthDate: '',
      address: '',
      postalCode: '',
      city: '',
      country: '',
      email: '',
      phone: '',
    })),
  );

  const updateStudent = (index: number, field: string, value: string) => {
    const newStudents = [...students];
    (newStudents[index] as any)[field] = value;
    setStudents(newStudents);
  };

  const handleStudentCountChange = (value: number) => {
    setStudentCount(value);
    if (value > students.length) {
      setStudents((prev) => [
        ...prev,
        ...Array.from({ length: value - prev.length }, () => ({
          lastName: '',
          firstName: '',
          birthDate: '',
          address: '',
          postalCode: '',
          city: '',
          country: '',
          email: '',
          phone: '',
        })),
      ]);
    } else if (value < students.length) {
      setStudents((prev) => prev.slice(0, value));
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div className="step company">
            <Input className="field" label={intl.formatMessage(messages.companyName)} required />
            <Input className="field" label={intl.formatMessage(messages.siret)} />
            <Input className="field" label={intl.formatMessage(messages.vatNumber)} />
            <Input className="field" label={intl.formatMessage(messages.address)} required />
            <Input className="field" label={intl.formatMessage(messages.postalCode)} required />
            <Input className="field" label={intl.formatMessage(messages.city)} required />
            <Input className="field" label={intl.formatMessage(messages.country)} required />
          </div>
        );
      case 1:
        return (
          <div className="step admin">
            <Input className="field" label={intl.formatMessage(messages.lastName)} />
            <Input className="field" label={intl.formatMessage(messages.firstName)} />
            <Input className="field" label={intl.formatMessage(messages.role)} />
            <Input className="field" label={intl.formatMessage(messages.email)} />
            <Input className="field" label={intl.formatMessage(messages.phone)} />
          </div>
        );
      case 2:
        return (
          <div className="step payment">
            <Input className="field" label={intl.formatMessage(messages.companyName)} />
            <Input className="field" label={intl.formatMessage(messages.siret)} />
            <Input className="field" label={intl.formatMessage(messages.address)} />
            <Input className="field" label={intl.formatMessage(messages.postalCode)} />
            <Input className="field" label={intl.formatMessage(messages.city)} />
            <Input className="field" label={intl.formatMessage(messages.country)} />
            <Input className="field" label={intl.formatMessage(messages.lastName)} />
            <Input className="field" label={intl.formatMessage(messages.email)} />
          </div>
        );
      case 3: {
        return (
          <div className="step student">
            <Input
              className="field"
              type="number"
              label={intl.formatMessage(messages.participantNumber)}
              value={studentCount}
              onChange={(e) => handleStudentCountChange(Number(e.target.value))}
              min={1}
            />

            {students.map((student, index) => (
              <div
                key={index}
                className="student-card"
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginTop: '1rem',
                }}
              >
                <h4>Participant {index + 1}</h4>
                <Input
                  className="field"
                  label={intl.formatMessage(messages.lastName)}
                  value={student.lastName}
                  onChange={(e) => updateStudent(index, 'lastName', e.target.value)}
                />
                <Input
                  className="field"
                  label={intl.formatMessage(messages.firstName)}
                  value={student.firstName}
                  onChange={(e) => updateStudent(index, 'firstName', e.target.value)}
                />
                <Input
                  className="field"
                  label={intl.formatMessage(messages.birthDate)}
                  value={student.birthDate}
                  onChange={(e) => updateStudent(index, 'birthDate', e.target.value)}
                />
                <Input
                  className="field"
                  label={intl.formatMessage(messages.address)}
                  value={student.address}
                  onChange={(e) => updateStudent(index, 'address', e.target.value)}
                />
                <Input
                  className="field"
                  label={intl.formatMessage(messages.postalCode)}
                  value={student.postalCode}
                  onChange={(e) => updateStudent(index, 'postalCode', e.target.value)}
                />
                <Input
                  className="field"
                  label={intl.formatMessage(messages.city)}
                  value={student.city}
                  onChange={(e) => updateStudent(index, 'city', e.target.value)}
                />
                <Input
                  className="field"
                  label={intl.formatMessage(messages.country)}
                  value={student.country}
                  onChange={(e) => updateStudent(index, 'country', e.target.value)}
                />
                <Input
                  className="field"
                  label={intl.formatMessage(messages.email)}
                  value={student.email}
                  onChange={(e) => updateStudent(index, 'email', e.target.value)}
                />
                <Input
                  className="field"
                  label={intl.formatMessage(messages.phone)}
                  value={student.phone}
                  onChange={(e) => updateStudent(index, 'phone', e.target.value)}
                />
              </div>
            ))}
          </div>
        );
      }
      case 4:
        return (
          <div className="step plan">
            <div className="payment-block">
              <Radio
                label={intl.formatMessage(messages.cardPayment)}
                onChange={() => setSelectedPayment('card')}
                checked={selectedPayment === 'card'}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Radio
                  label={intl.formatMessage(messages.bankTransfer)}
                  onChange={() => setSelectedPayment('bank')}
                  checked={selectedPayment === 'bank'}
                />
                <Checkbox
                  label={intl.formatMessage(messages.withOrderForm)}
                  disabled={selectedPayment !== 'bank'}
                />
              </div>
            </div>
            <div className="organism-block">
              <Select
                label={intl.formatMessage(messages.withOrderForm)}
                value={selectedOrganism}
                onChange={(e) => setSelectedOrganism(e.target.value as string)}
                options={[
                  { label: intl.formatMessage(messages.opco), value: 'opco' },
                  { label: intl.formatMessage(messages.jobCenter), value: 'jobCenter' },
                  { label: intl.formatMessage(messages.other), value: 'other' },
                ]}
                clearable={false}
                fullWidth
              />
              {selectedOrganism === 'opco' && (
                <div>
                  <Input className="field" label={intl.formatMessage(messages.opcoName)} />
                  <Input className="field" label={intl.formatMessage(messages.opcoAmount)} />
                </div>
              )}
              {selectedOrganism === 'jobCenter' && (
                <Input className="field" label={intl.formatMessage(messages.jobCenterAmount)} />
              )}
              {selectedOrganism === 'other' && (
                <Input className="field" label={intl.formatMessage(messages.otherSpecify)} />
              )}
            </div>
            <Select
              label={intl.formatMessage(messages.participatingUniversities)}
              value="rennes1"
              clearable={false}
              options={[
                { label: 'Rennes 1', value: 'rennes1' },
                { label: 'Rennes 2', value: 'rennes2' },
              ]}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="sale-tunnel__group-buy-form">
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label, index) => (
          <Step key={label} onClick={() => setActiveStep(index)} style={{ cursor: 'pointer' }}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <div className="step-content">{renderStepContent(activeStep)}</div>
    </div>
  );
};
