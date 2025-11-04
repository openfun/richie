import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import AbstractContractFrame, {
  AbstractProps,
} from 'components/ContractFrame/AbstractContractFrame';
import { Agreement, Offering } from 'types/Joanie';

interface Props extends AbstractProps {
  agreementIds?: Agreement['id'][];
  organizationId: string;
  offeringIds?: Offering['id'][];
}

const OrganizationAgreementFrame = ({
  organizationId,
  offeringIds = [],
  agreementIds,
  onDone,
  ...props
}: Props) => {
  const api = useJoanieApi();
  const queryClient = useQueryClient();
  const [agreementsIdsToCheck, setAgreementsIdsToCheck] = useState(agreementIds);

  const getInvitationLink = async () => {
    /*
     The API returns the invitation link to sign contracts and a list of contracts ids which should
     be signed. We need to keep track of these ids to check if all contracts have been signed.
     */
    const response = await api.organizations.contracts.getSignatureLinks({
      offering_ids: offeringIds,
      organization_id: organizationId,
      contracts_ids: agreementIds,
      from_batch_order: true,
    });
    setAgreementsIdsToCheck(response.contract_ids);
    return response.invitation_link;
  };

  /*
   * Check if all contracts to signed has been signed.
   */
  const checkAgreementsSignature = async () => {
    const { results: agreementsToCheck } = await api.organizations.agreements.get({
      organization_id: organizationId,
      contract_ids: agreementsIdsToCheck,
    });
    const isSigned = agreementsToCheck.every((agreement) =>
      Boolean(agreement?.organization_signed_on),
    );

    return { isSigned };
  };

  const onDoneWithInvalidation = () => {
    queryClient.invalidateQueries({ queryKey: ['user', 'organizationAgreements'] });
    onDone?.();
  };

  return (
    <AbstractContractFrame
      getInvitationLink={getInvitationLink}
      checkSignature={checkAgreementsSignature}
      onDone={onDoneWithInvalidation}
      {...props}
    />
  );
};

export default OrganizationAgreementFrame;
