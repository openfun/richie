import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import AbstractContractFrame, {
  AbstractProps,
} from 'components/ContractFrame/AbstractContractFrame';
import { Contract } from 'types/Joanie';

interface Props extends AbstractProps {
  contractIds?: Contract['id'][];
  organizationId: string;
}

const OrganizationContractFrame = ({ organizationId, contractIds, onDone, ...props }: Props) => {
  const api = useJoanieApi();
  const queryClient = useQueryClient();
  const [contractIdsToCheck, setContractIdsToCheck] = useState(contractIds);

  const getInvitationLink = async () => {
    /*
     The API returns the invitation link to sign contracts and a list of contracts ids which should
     be signed. We need to keep track of these ids to check if all contracts have been signed.
     */
    const response = await api.organizations.contracts.getSignatureLinks({
      organization_id: organizationId,
      contracts_ids: contractIds,
    });
    setContractIdsToCheck(response.contract_ids);
    return response.invitation_link;
  };

  /*
   * Check if all contracts to signed has been signed.
   */
  const checkContractsSignature = async () => {
    const { results: contractsToCheck } = await api.organizations.contracts.get({
      organization_id: organizationId,
      contract_ids: contractIdsToCheck,
    });
    const isSigned = contractsToCheck.every((contract) =>
      Boolean(contract?.organization_signed_on),
    );

    return { isSigned };
  };

  const onDoneWithInvalidation = () => {
    queryClient.invalidateQueries({ queryKey: ['user', 'organization_contracts'] });
    onDone?.();
  };

  return (
    <AbstractContractFrame
      getInvitationLink={getInvitationLink}
      checkSignature={checkContractsSignature}
      onDone={onDoneWithInvalidation}
      {...props}
    />
  );
};

export default OrganizationContractFrame;
