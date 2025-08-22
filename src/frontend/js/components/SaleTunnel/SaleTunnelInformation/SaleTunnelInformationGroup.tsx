import { yupResolver } from '@hookform/resolvers/yup';
import { Step, StepLabel, Stepper } from '@mui/material';
import { Button, Input, Radio, RadioGroup, Select } from '@openfun/cunningham-react';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { BatchOrder } from 'types/Joanie';
import * as Yup from 'yup';
import Form, { CountrySelectField, getLocalizedCunninghamErrorProp } from 'components/Form';
import { useSaleTunnelContext } from '../GenericSaleTunnel';

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
    id: 'components.SaleTunnel.BatchOrderForm.stepCompany',
    defaultMessage: 'Organization',
  },
  stepAdmin: {
    id: 'components.SaleTunnel.BatchOrderForm.stepAdmin',
    defaultMessage: 'Follow-up',
  },
  stepBilling: {
    id: 'components.SaleTunnel.BatchOrderForm.stepBilling',
    defaultMessage: 'Billing',
  },
  stepParticipants: {
    id: 'components.SaleTunnel.BatchOrderForm.stepParticipants',
    defaultMessage: 'Participants',
  },
  stepFinancing: {
    id: 'components.SaleTunnel.BatchOrderForm.stepFinancing',
    defaultMessage: 'Financing',
  },
  stepCompanyTitle: {
    id: 'components.SaleTunnel.BatchOrderForm.stepCompanyTitle',
    defaultMessage: 'Information about your company / organisation',
  },
  stepAdminTitle: {
    id: 'components.SaleTunnel.BatchOrderForm.stepAdminTitle',
    defaultMessage: 'Responsible for the administrative follow-up',
  },
  stepBillingTitle: {
    id: 'components.SaleTunnel.BatchOrderForm.stepBillingTitle',
    defaultMessage: 'Needed if it does not concerns the initial company OR if OPCO',
  },
  stepParticipantsTitle: {
    id: 'components.SaleTunnel.BatchOrderForm.stepParticipantsTitle',
    defaultMessage: 'How many registrations ?',
  },
  stepFinancingTitle: {
    id: 'components.SaleTunnel.BatchOrderForm.stepFinancingTitle',
    defaultMessage: 'Payment plan of the course',
  },
  companyName: { id: 'batchOrder.companyName', defaultMessage: 'Company name' },
  identificationNumber: {
    id: 'batchOrder.identificationNumber',
    defaultMessage: 'Identification number (SIRET for french company)',
  },
  vatNumber: { id: 'batchOrder.vatNumber', defaultMessage: 'VAT number' },
  address: { id: 'batchOrder.address', defaultMessage: 'Address' },
  postCode: { id: 'batchOrder.postCode', defaultMessage: 'Post code' },
  city: { id: 'batchOrder.city', defaultMessage: 'City' },
  country: { id: 'batchOrder.country', defaultMessage: 'Country' },
  firstName: { id: 'batchOrder.firstName', defaultMessage: 'First name' },
  lastName: { id: 'batchOrder.lastName', defaultMessage: 'Last name' },
  role: { id: 'batchOrder.role', defaultMessage: 'Role' },
  email: { id: 'batchOrder.email', defaultMessage: 'Email' },
  phone: { id: 'batchOrder.phone', defaultMessage: 'Phone' },
  contactName: { id: 'batchOrder.contactName', defaultMessage: 'Name of the contact' },
  contactEmail: { id: 'batchOrder.contactEmail', defaultMessage: 'Email of the contact' },
  nbSeats: { id: 'batchOrder.nbSeats', defaultMessage: 'How many participants ?' },
  cardPayment: { id: 'batchOrder.cardPayment', defaultMessage: 'Payment by credit card' },
  bankTransfer: { id: 'batchOrder.bankTransfer', defaultMessage: 'Payment by bank transfer' },
  purchaseOrder: { id: 'batchOrder.purchaseOrder', defaultMessage: 'Payment with purchase order' },
  withoutOrderForm: { id: 'batchOrder.withoutOrderForm', defaultMessage: 'Without order form' },
  opco: { id: 'batchOrder.opc', defaultMessage: 'OPCO' },
  fundingEntity: { id: 'batchOrder.fundingEntity', defaultMessage: 'Funding entity' },
  fundingEntityName: { id: 'batchOrder.fundingEntityName', defaultMessage: 'Entity name' },
  fundingEntityAmount: { id: 'batchOrder.fundingEntityAmount', defaultMessage: 'Amount covered' },
  recommandation: {
    id: 'batchOrder.recommandation',
    defaultMessage: 'This course was recommended to me by',
  },
  participatingOrganisations: {
    id: 'batchOrder.participatingOrganisations',
    defaultMessage: 'Participating organisations',
  },
  formError: {
    id: 'batchOrder.formError',
    defaultMessage: 'Missing fields in form',
  },
});

export const SaleTunnelInformationGroup = () => {
  return (
    <>
      <div>
        <h3 className="block-title mb-t">
          <FormattedMessage {...messages.title} />
        </h3>
        <div className="description mb-s">
          <FormattedMessage {...messages.description} />
        </div>
      </div>
      <BatchOrderForm />
    </>
  );
};

const BatchOrderForm = () => {
  const { offering, batchOrder, setBatchOrder } = useSaleTunnelContext();
  const validationSchema = Yup.object().shape({
    offering_id: Yup.string().required(),
    company_name: Yup.string().required(),
    identification_number: Yup.string(),
    vat_registration: Yup.string(),
    address: Yup.string().required(),
    postcode: Yup.string().required(),
    city: Yup.string().required(),
    country: Yup.string().required(),
    administrative_last_name: Yup.string().required(),
    administrative_first_name: Yup.string().required(),
    administrative_profession: Yup.string().required(),
    administrative_email: Yup.string().required(),
    administrative_telephone: Yup.string().required(),
    billing: Yup.object().shape({
      company_name: Yup.string(),
      identification_number: Yup.string(),
      contact_name: Yup.string(),
      contact_email: Yup.string().email(),
      address: Yup.string(),
      postcode: Yup.string(),
      city: Yup.string(),
      country: Yup.string(),
    }),
    nb_seats: Yup.number().required().min(1),
    payment_method: Yup.string().required(),
    funding_entity: Yup.string(),
    funding_amount: Yup.number(),
    organization_id: Yup.string(),
  });

  const defaultValues: BatchOrder = {
    offering_id: offering?.id ?? '',
    company_name: 'Company',
    identification_number: 'ID-123456',
    vat_registration: 'FR123456789',
    address: '61 Bis rue de la Glacière',
    postcode: '75012',
    city: 'Paris',
    country: 'FR',
    administrative_last_name: 'Dupont',
    administrative_first_name: 'Jean',
    administrative_profession: 'Responsable administratif',
    administrative_email: 'jean.dupont@mail.fr',
    administrative_telephone: '+33123456789',
    billing: {
      company_name: 'Company Billing',
      identification_number: 'BILL-98765',
      contact_name: 'Marie Curie',
      contact_email: 'marie.curie@mail.fr',
      address: '10 Rue de la Facturation',
      postcode: '69000',
      city: 'Lyon',
      country: 'FR',
    },
    nb_seats: 100,
    payment_method: 'card_payment',
    funding_entity: 'opco',
    funding_amount: 0,
    organization_id: 'Par un partenaire',
  };

  const form = useForm<BatchOrder>({
    defaultValues: batchOrder || defaultValues,
    mode: 'onBlur',
    resolver: yupResolver(validationSchema),
  });

  const { handleSubmit, reset, register, formState } = form;

  useEffect(() => {
    reset(batchOrder ?? defaultValues);
  }, [batchOrder]);

  const [activeStep, setActiveStep] = useState(0);
  const intl = useIntl();

  const steps = [
    intl.formatMessage(messages.stepCompany),
    intl.formatMessage(messages.stepAdmin),
    intl.formatMessage(messages.stepBilling),
    intl.formatMessage(messages.stepParticipants),
    intl.formatMessage(messages.stepFinancing),
  ];

  const submitBatchOrder = async (data: BatchOrder) => {
    setBatchOrder(data);
  };

  const renderStepContent = () => {
    return (
      <div className="step-content">
        <div className="step organization" hidden={activeStep !== 0}>
          <FormattedMessage {...messages.stepCompanyTitle} />
          <Input
            className="field"
            label={intl.formatMessage(messages.companyName)}
            {...register('company_name')}
            required
            state={formState.errors.company_name?.message ? 'error' : 'default'}
            text={
              getLocalizedCunninghamErrorProp(intl, formState.errors.company_name?.message).text
            }
          />
          <Input
            className="field"
            {...register('identification_number')}
            label={intl.formatMessage(messages.identificationNumber)}
          />
          <Input
            className="field"
            {...register('vat_registration')}
            label={intl.formatMessage(messages.vatNumber)}
          />
          <Input
            className="field"
            {...register('address')}
            label={intl.formatMessage(messages.address)}
            required
            state={formState.errors.address?.message ? 'error' : 'default'}
            text={getLocalizedCunninghamErrorProp(intl, formState.errors.address?.message).text}
          />
          <div className="city-fields">
            <Input
              className="field"
              {...register('postcode')}
              label={intl.formatMessage(messages.postCode)}
              required
              state={formState.errors.postcode?.message ? 'error' : 'default'}
              text={getLocalizedCunninghamErrorProp(intl, formState.errors.postcode?.message).text}
            />
            <Input
              className="field"
              {...register('city')}
              label={intl.formatMessage(messages.city)}
              required
              state={formState.errors.city?.message ? 'error' : 'default'}
              text={getLocalizedCunninghamErrorProp(intl, formState.errors.city?.message).text}
            />
          </div>
          <CountrySelectField
            className="field"
            {...register('country')}
            label={intl.formatMessage(messages.country)}
            state={formState.errors.country?.message ? 'error' : 'default'}
            text={getLocalizedCunninghamErrorProp(intl, formState.errors.country?.message).text}
          />
        </div>
        <div className="step admin" hidden={activeStep !== 1}>
          <FormattedMessage {...messages.stepAdminTitle} />
          <Input
            className="field"
            {...register('administrative_last_name')}
            label={intl.formatMessage(messages.lastName)}
            required
            state={formState.errors.administrative_last_name?.message ? 'error' : 'default'}
            text={
              getLocalizedCunninghamErrorProp(
                intl,
                formState.errors.administrative_last_name?.message,
              ).text
            }
          />
          <Input
            className="field"
            {...register('administrative_first_name')}
            label={intl.formatMessage(messages.firstName)}
            required
            state={formState.errors.administrative_first_name?.message ? 'error' : 'default'}
            text={
              getLocalizedCunninghamErrorProp(
                intl,
                formState.errors.administrative_first_name?.message,
              ).text
            }
          />
          <Input
            className="field"
            {...register('administrative_profession')}
            label={intl.formatMessage(messages.role)}
            required
            state={formState.errors.administrative_profession?.message ? 'error' : 'default'}
            text={
              getLocalizedCunninghamErrorProp(
                intl,
                formState.errors.administrative_profession?.message,
              ).text
            }
          />
          <Input
            className="field"
            {...register('administrative_email')}
            label={intl.formatMessage(messages.email)}
            required
            state={formState.errors.administrative_email?.message ? 'error' : 'default'}
            text={
              getLocalizedCunninghamErrorProp(intl, formState.errors.administrative_email?.message)
                .text
            }
          />
          <Input
            className="field"
            {...register('administrative_telephone')}
            label={intl.formatMessage(messages.phone)}
            required
            state={formState.errors.administrative_telephone?.message ? 'error' : 'default'}
            text={
              getLocalizedCunninghamErrorProp(
                intl,
                formState.errors.administrative_telephone?.message,
              ).text
            }
          />
        </div>
        <div className="step billing" hidden={activeStep !== 2}>
          <FormattedMessage {...messages.stepBillingTitle} />
          <Input
            className="field"
            {...register('billing.company_name')}
            label={intl.formatMessage(messages.companyName)}
          />
          <Input
            className="field"
            {...register('billing.identification_number')}
            label={intl.formatMessage(messages.identificationNumber)}
          />
          <Input
            className="field"
            {...register('billing.address')}
            label={intl.formatMessage(messages.address)}
          />
          <div className="city-fields">
            <Input
              className="field"
              {...register('billing.postcode')}
              label={intl.formatMessage(messages.postCode)}
            />
            <Input
              className="field"
              {...register('billing.city')}
              label={intl.formatMessage(messages.city)}
            />
          </div>
          <CountrySelectField
            className="field"
            {...register('billing.country')}
            label={intl.formatMessage(messages.country)}
          />
          <Input
            className="field"
            {...register('billing.contact_name')}
            label={intl.formatMessage(messages.contactName)}
          />
          <Input
            className="field"
            {...register('billing.contact_email')}
            label={intl.formatMessage(messages.contactEmail)}
          />
        </div>
        <div className="step seats" hidden={activeStep !== 3}>
          <FormattedMessage {...messages.stepParticipantsTitle} />
          <Input
            className="field"
            type="number"
            {...register('nb_seats')}
            label={intl.formatMessage(messages.nbSeats)}
            required
            state={formState.errors.nb_seats?.message ? 'error' : 'default'}
            text={getLocalizedCunninghamErrorProp(intl, formState.errors.nb_seats?.message).text}
          />
        </div>
        <div className="step financing" hidden={activeStep !== 4}>
          <FormattedMessage {...messages.stepFinancingTitle} />
          <RadioGroup fullWidth={true} className="payment-block">
            <Radio
              {...register('payment_method')}
              value="card_payment"
              label={intl.formatMessage(messages.cardPayment)}
              required
              state={formState.errors.payment_method?.message ? 'error' : 'default'}
              text={
                getLocalizedCunninghamErrorProp(intl, formState.errors.payment_method?.message).text
              }
            />
            <Radio
              {...register('payment_method')}
              value="bank_transfer"
              label={intl.formatMessage(messages.bankTransfer)}
              required
              state={formState.errors.payment_method?.message ? 'error' : 'default'}
              text={
                getLocalizedCunninghamErrorProp(intl, formState.errors.payment_method?.message).text
              }
            />
            <Radio
              {...register('payment_method')}
              value="purchase_order"
              label={intl.formatMessage(messages.purchaseOrder)}
              required
              state={formState.errors.payment_method?.message ? 'error' : 'default'}
              text={
                getLocalizedCunninghamErrorProp(intl, formState.errors.payment_method?.message).text
              }
            />
          </RadioGroup>
          <FormattedMessage {...messages.fundingEntity} />
          <div className="organism-block">
            <Input
              {...register('funding_entity')}
              label={intl.formatMessage(messages.fundingEntityName)}
              required
              state={formState.errors.funding_entity?.message ? 'error' : 'default'}
              text={
                getLocalizedCunninghamErrorProp(intl, formState.errors.funding_entity?.message).text
              }
            />
            <Input
              {...register('funding_amount')}
              type="number"
              label={intl.formatMessage(messages.fundingEntityAmount)}
              required
              state={formState.errors.funding_amount?.message ? 'error' : 'default'}
              text={
                getLocalizedCunninghamErrorProp(intl, formState.errors.funding_amount?.message).text
              }
            />
          </div>
          <FormattedMessage {...messages.recommandation} />
          <Select
            {...register('organization_id')}
            label={intl.formatMessage(messages.participatingOrganisations)}
            clearable={false}
            options={[
              { label: 'Rennes 1', value: 'rennes1' },
              { label: 'Rennes 2', value: 'rennes2' },
            ]}
            className="recommandation"
          />
        </div>
      </div>
    );
  };

  return (
    <FormProvider {...form}>
      <Form onSubmit={handleSubmit(submitBatchOrder)} noValidate>
        <Stepper activeStep={activeStep} alternativeLabel className="stepper">
          {steps.map((label, index) => (
            <Step key={label} onClick={() => setActiveStep(index)} style={{ cursor: 'pointer' }}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {renderStepContent()}
        <Button type="submit">Validate</Button>
      </Form>
    </FormProvider>
  );
};
