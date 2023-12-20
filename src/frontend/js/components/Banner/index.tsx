import { uniqueId } from 'lodash-es';
import { useMemo } from 'react';

export enum BannerType {
  ERROR = 'error',
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
}

interface BannerProps {
  message: string;
  type?: BannerType;
  rounded?: boolean;
}

export const getBannerTestId = (message: string, type: BannerType) => {
  return `banner-${type}-${uniqueId(message)}`;
};

const Banner = ({ message, rounded, type = BannerType.INFO }: BannerProps) => {
  const className = useMemo(
    (): string => ['banner', `banner--${type}`, ...(rounded ? ['banner--rounded'] : [])].join(' '),
    [type, rounded],
  );

  return (
    <div className={className} data-testid={getBannerTestId(message, type)}>
      <p className="banner__message">{message}</p>
    </div>
  );
};

export default Banner;
