import { useQueryClient } from '@tanstack/react-query';
import { CredentialOrder, NestedCredentialOrder } from 'types/Joanie';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import AbstractContractFrame, {
  AbstractProps,
} from 'components/ContractFrame/AbstractContractFrame';

interface Props extends AbstractProps {
  order: CredentialOrder | NestedCredentialOrder;
}

const LearnerContractFrame = ({ order, onDone, ...props }: Props) => {
  const api = useJoanieApi();
  const queryClient = useQueryClient();
  const getInvitationLink = async () => {
    const response = await api.user.orders.submit_for_signature(order.id);
    return response.invitation_link;
  };
  const checkOrderSignature = async () => {
    const orderToCheck = await api.user.orders.get({ id: order.id });
    const isSigned = Boolean(orderToCheck?.contract?.student_signed_on);

    return { isSigned };
  };

  const onDoneWithInvalidation = () => {
    queryClient.invalidateQueries({ queryKey: ['user', 'orders'] });
    queryClient.invalidateQueries({ queryKey: ['user', 'contracts'] });
    onDone?.();
  };

  return (
    <AbstractContractFrame
      getInvitationLink={getInvitationLink}
      checkSignature={checkOrderSignature}
      onDone={onDoneWithInvalidation}
      {...props}
    />
  );
};

export default LearnerContractFrame;
