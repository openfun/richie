import { useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { UseFormReturn } from 'react-hook-form';
import { Checkbox, Input, Radio, RadioGroup, Select } from '@openfun/cunningham-react';
import { useOfferingOrganizations } from 'hooks/useOfferingOrganizations';
import { BatchOrder } from 'types/Joanie';
import { CountrySelectField, getLocalizedCunninghamErrorProp } from 'components/Form';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import { PaymentMethod } from 'components/PaymentInterfaces/types';

const messages = defineMessages({
  stepCompany: {
    id: 'components.SaleTunnel.BatchOrderForm.stepCompany',
    description: 'Step label for company information in the batch order form',
    defaultMessage: 'Organization',
  },
  stepAdmin: {
    id: 'components.SaleTunnel.BatchOrderForm.stepAdmin',
    description: 'Step label for administrative follow-up in the batch order form',
    defaultMessage: 'Follow-up',
  },
  stepParticipants: {
    id: 'components.SaleTunnel.BatchOrderForm.stepParticipants',
    description: 'Step label for participants information in the batch order form',
    defaultMessage: 'Participants',
  },
  stepFinancing: {
    id: 'components.SaleTunnel.BatchOrderForm.stepFinancing',
    description: 'Step label for financing/payment in the batch order form',
    defaultMessage: 'Financing',
  },
  stepCompanyTitle: {
    id: 'components.SaleTunnel.BatchOrderForm.stepCompanyTitle',
    description: 'Title of the section with company/organization details',
    defaultMessage: 'Information about your company / organisation',
  },
  stepAdminTitle: {
    id: 'components.SaleTunnel.BatchOrderForm.stepAdminTitle',
    description:
      'Title of the section with details about the person responsible for admin follow-up',
    defaultMessage: 'Administrative contact',
  },
  stepSignatoryTitle: {
    id: 'components.SaleTunnel.BatchOrderForm.stepSignatoryTitle',
    description:
      'Title of the section with details about the person responsible for signing the quote',
    defaultMessage: 'Authorized signatory',
  },
  stepBillingTitle: {
    id: 'components.SaleTunnel.BatchOrderForm.stepBillingTitle',
    description: 'Title of the section with billing details',
    defaultMessage: 'Billing details',
  },
  stepParticipantsTitle: {
    id: 'components.SaleTunnel.BatchOrderForm.stepParticipantsTitle',
    description: 'Title of the section to enter the number of registrations/participants',
    defaultMessage: 'Number of registrations',
  },
  stepFinancingTitle: {
    id: 'components.SaleTunnel.BatchOrderForm.stepFinancingTitle',
    description: 'Title of the section to select the payment plan of the course',
    defaultMessage: 'Ordering method',
  },
  companyName: {
    id: 'batchOrder.companyName',
    description: 'Label for the field asking the name of the company',
    defaultMessage: 'Company name',
  },
  identificationNumber: {
    id: 'batchOrder.identificationNumber',
    description:
      'Label for the field asking the company identification number (eg. SIRET in France)',
    defaultMessage: 'Registration number (SIRET for French companies)',
  },
  vatNumber: {
    id: 'batchOrder.vatNumber',
    description: 'Label for the field asking the company VAT number',
    defaultMessage: 'VAT number',
  },
  address: {
    id: 'batchOrder.address',
    description: 'Label for the field asking the company address',
    defaultMessage: 'Address',
  },
  postCode: {
    id: 'batchOrder.postCode',
    description: 'Label for the field asking the postal code',
    defaultMessage: 'Postal code',
  },
  city: {
    id: 'batchOrder.city',
    description: 'Label for the field asking the city',
    defaultMessage: 'City',
  },
  country: {
    id: 'batchOrder.country',
    description: 'Label for the field asking the country',
    defaultMessage: 'Country',
  },
  firstName: {
    id: 'batchOrder.firstName',
    description: 'Label for the field asking the first name of the contact person',
    defaultMessage: 'First name',
  },
  lastName: {
    id: 'batchOrder.lastName',
    description: 'Label for the field asking the last name of the contact person',
    defaultMessage: 'Last name',
  },
  role: {
    id: 'batchOrder.role',
    description: 'Label for the field asking the role/position of the contact person',
    defaultMessage: 'Role',
  },
  email: {
    id: 'batchOrder.email',
    description: 'Label for the field asking the email address of the contact person',
    defaultMessage: 'Email',
  },
  phone: {
    id: 'batchOrder.phone',
    description: 'Label for the field asking the phone number of the contact person',
    defaultMessage: 'Phone number',
  },
  checkBilling: {
    id: 'components.SaleTunnel.BatchOrderForm.checkBilling',
    description: 'Checkbox label to indicate using alternative billing information',
    defaultMessage: 'Use different billing information',
  },
  contactName: {
    id: 'batchOrder.contactName',
    description: 'Label for the field asking the billing contact name',
    defaultMessage: 'Contact name',
  },
  contactEmail: {
    id: 'batchOrder.contactEmail',
    description: 'Label for the field asking the billing contact email',
    defaultMessage: 'Contact email',
  },
  nbSeats: {
    id: 'batchOrder.nbSeats',
    description: 'Label for the field asking the number of participants/seats',
    defaultMessage: 'Number of participants to register',
  },
  cardPayment: {
    id: 'batchOrder.cardPayment',
    description: 'Option label for selecting credit card payment',
    defaultMessage: 'Credit card',
  },
  bankTransfer: {
    id: 'batchOrder.bankTransfer',
    description: 'Option label for selecting bank transfer payment',
    defaultMessage: 'Bank transfer',
  },
  purchaseOrder: {
    id: 'batchOrder.purchaseOrder',
    description: 'Option label for selecting payment via purchase order',
    defaultMessage: 'Purchase order',
  },
  withoutOrderForm: {
    id: 'batchOrder.withoutOrderForm',
    description: 'Option label for selecting payment without order form',
    defaultMessage: 'Without order form',
  },
  opco: {
    id: 'batchOrder.opc',
    description: 'Label for the field asking the OPCO (French training funding organisation)',
    defaultMessage: 'OPCO',
  },
  fundingEntity: {
    id: 'batchOrder.fundingEntity',
    description: 'Label for the field asking the type of funding entity',
    defaultMessage: 'Funding entity',
  },
  fundingEntityName: {
    id: 'batchOrder.fundingEntityName',
    description: 'Label for the field asking the name of the funding entity',
    defaultMessage: 'Entity name',
  },
  fundingEntityAmount: {
    id: 'batchOrder.fundingEntityAmount',
    description: 'Label for the field asking the amount covered by the funding entity',
    defaultMessage: 'Amount covered',
  },
  recommandation: {
    id: 'batchOrder.recommandation',
    description:
      'Label for the field asking how the user heard about or was recommended the course',
    defaultMessage: 'This course was recommended to me by',
  },
  participatingOrganisations: {
    id: 'batchOrder.participatingOrganisations',
    description: 'Label for the field listing other participating organisations',
    defaultMessage: 'Participating organizations',
  },
});

export const StepContent = ({
  activeStep,
  form,
}: {
  activeStep: number;
  form: UseFormReturn<BatchOrder>;
}) => {
  const intl = useIntl();
  const { register, formState } = form;
  const { offering } = useSaleTunnelContext();
  const { items: organizations } = useOfferingOrganizations({ id: offering?.id });
  const orgOptions = organizations.map((organization) => ({
    label: organization.title,
    value: organization.id,
  }));
  const [otherBillingAddress, setOtherBillingAddress] = useState(false);

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
          text={getLocalizedCunninghamErrorProp(intl, formState.errors.company_name?.message).text}
        />
        <Input
          className="field"
          {...register('identification_number')}
          required
          state={formState.errors.identification_number?.message ? 'error' : 'default'}
          text={
            getLocalizedCunninghamErrorProp(intl, formState.errors.identification_number?.message)
              .text
          }
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
        <Checkbox
          label={intl.formatMessage(messages.checkBilling)}
          onChange={() => {
            setOtherBillingAddress(!otherBillingAddress);
            form.resetField('billing_address');
            form.resetField('billing_address.contact_name');
            form.resetField('billing_address.contact_email');
            form.resetField('billing_address.company_name');
            form.resetField('billing_address.identification_number');
            form.resetField('billing_address.address');
            form.resetField('billing_address.postcode');
            form.resetField('billing_address.city');
            form.resetField('billing_address.country');
            form.clearErrors();
          }}
          checked={otherBillingAddress}
        />
      </div>
      {otherBillingAddress && (
        <div className="step billing" hidden={activeStep !== 0}>
          <FormattedMessage {...messages.stepBillingTitle} />
          <Input
            className="field"
            {...register('billing_address.contact_name')}
            label={intl.formatMessage(messages.contactName)}
          />
          <Input
            className="field"
            {...register('billing_address.contact_email')}
            label={intl.formatMessage(messages.contactEmail)}
            state={formState.errors.billing_address?.contact_email?.message ? 'error' : 'default'}
            text={
              getLocalizedCunninghamErrorProp(
                intl,
                formState.errors.billing_address?.contact_email?.message,
              ).text
            }
          />
          <Input
            className="field"
            {...register('billing_address.company_name')}
            label={intl.formatMessage(messages.companyName)}
          />
          <Input
            className="field"
            {...register('billing_address.identification_number')}
            label={intl.formatMessage(messages.identificationNumber)}
          />
          <Input
            className="field"
            {...register('billing_address.address')}
            label={intl.formatMessage(messages.address)}
          />
          <div className="city-fields">
            <Input
              className="field"
              {...register('billing_address.postcode')}
              label={intl.formatMessage(messages.postCode)}
            />
            <Input
              className="field"
              {...register('billing_address.city')}
              label={intl.formatMessage(messages.city)}
            />
          </div>
          <CountrySelectField
            className="field"
            {...register('billing_address.country')}
            label={intl.formatMessage(messages.country)}
          />
        </div>
      )}
      <div className="step admin" hidden={activeStep !== 1}>
        <FormattedMessage {...messages.stepAdminTitle} />
        <Input
          className="field"
          {...register('administrative_lastname')}
          label={intl.formatMessage(messages.lastName)}
          required
          state={formState.errors.administrative_lastname?.message ? 'error' : 'default'}
          text={
            getLocalizedCunninghamErrorProp(intl, formState.errors.administrative_lastname?.message)
              .text
          }
        />
        <Input
          className="field"
          {...register('administrative_firstname')}
          label={intl.formatMessage(messages.firstName)}
          required
          state={formState.errors.administrative_firstname?.message ? 'error' : 'default'}
          text={
            getLocalizedCunninghamErrorProp(
              intl,
              formState.errors.administrative_firstname?.message,
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
      <div className="step signatory" hidden={activeStep !== 2}>
        <FormattedMessage {...messages.stepSignatoryTitle} />
        <Input
          className="field"
          {...register('signatory_lastname')}
          label={intl.formatMessage(messages.lastName)}
          required
          state={formState.errors.signatory_lastname?.message ? 'error' : 'default'}
          text={
            getLocalizedCunninghamErrorProp(intl, formState.errors.signatory_lastname?.message).text
          }
        />
        <Input
          className="field"
          {...register('signatory_firstname')}
          label={intl.formatMessage(messages.firstName)}
          required
          state={formState.errors.signatory_firstname?.message ? 'error' : 'default'}
          text={
            getLocalizedCunninghamErrorProp(intl, formState.errors.signatory_firstname?.message)
              .text
          }
        />
        <Input
          className="field"
          {...register('signatory_profession')}
          label={intl.formatMessage(messages.role)}
          required
          state={formState.errors.signatory_profession?.message ? 'error' : 'default'}
          text={
            getLocalizedCunninghamErrorProp(intl, formState.errors.signatory_profession?.message)
              .text
          }
        />
        <Input
          className="field"
          {...register('signatory_email')}
          label={intl.formatMessage(messages.email)}
          required
          state={formState.errors.signatory_email?.message ? 'error' : 'default'}
          text={
            getLocalizedCunninghamErrorProp(intl, formState.errors.signatory_email?.message).text
          }
        />
        <Input
          className="field"
          {...register('signatory_telephone')}
          label={intl.formatMessage(messages.phone)}
          required
          state={formState.errors.signatory_telephone?.message ? 'error' : 'default'}
          text={
            getLocalizedCunninghamErrorProp(intl, formState.errors.signatory_telephone?.message)
              .text
          }
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
            value={PaymentMethod.CARD_PAYMENT}
            label={intl.formatMessage(messages.cardPayment)}
            required
            state={formState.errors.payment_method?.message ? 'error' : 'default'}
            text={
              getLocalizedCunninghamErrorProp(intl, formState.errors.payment_method?.message).text
            }
          />
          <Radio
            {...register('payment_method')}
            value={PaymentMethod.BANK_TRANSFER}
            label={intl.formatMessage(messages.bankTransfer)}
            required
            state={formState.errors.payment_method?.message ? 'error' : 'default'}
            text={
              getLocalizedCunninghamErrorProp(intl, formState.errors.payment_method?.message).text
            }
          />
          <Radio
            {...register('payment_method')}
            value={PaymentMethod.PURCHASE_ORDER}
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
          />
          <Input
            {...register('funding_amount')}
            type="number"
            label={intl.formatMessage(messages.fundingEntityAmount)}
          />
        </div>
        <FormattedMessage {...messages.recommandation} />
        <Select
          {...register('organization_id')}
          label={intl.formatMessage(messages.participatingOrganisations)}
          clearable
          options={orgOptions}
          className="recommandation"
        />
      </div>
    </div>
  );
};
