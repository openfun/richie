import { useLocation } from 'react-router';

const LocationDisplay = () => {
  const location = useLocation();

  return <div data-testid="test-location-display">{location.pathname}</div>;
};

export default LocationDisplay;
