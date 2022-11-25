import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const Example = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('404');
  });

  return <div>Example Route</div>;
};
