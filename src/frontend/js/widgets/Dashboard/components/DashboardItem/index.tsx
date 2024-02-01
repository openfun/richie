import { PropsWithChildren, ReactNode } from 'react';
import { Button } from '@openfun/cunningham-react';
import { useSelect } from 'downshift';
import { defineMessages, useIntl } from 'react-intl';
import { JoanieFile } from 'types/Joanie';
import { Nullable, PropsWithTestId } from 'types/utils';
import { Icon, IconTypeEnum } from 'components/Icon';

const messages = defineMessages({
  moreLabel: {
    id: 'components.DashboardItem.more_label',
    description: 'Accessible label for the more button on the dashboard item',
    defaultMessage: 'See additional options',
  },
});

export type DashboardItemProps = PropsWithTestId<{
  title: ReactNode;
  code?: string;
  imageUrl?: string;
  imageFile?: Nullable<JoanieFile>;
  footer?: ReactNode;
  mode?: 'full' | 'compact';
  more?: ReactNode;
}>;

// This is temporary due to the fact that backend doesn't give this attribute yet.
export const DEMO_IMAGE_URL =
  'https://dz03nossv7tsm.cloudfront.net/media/filer_public_thumbnails/filer_public/12/32/123267a1-bc28-49ca-bfca-679568c34043/logo_upsaclay-2020.jpg__200x113_q85_replace_alpha-%23FFFFFF_subsampling-2_upscale.jpg';

export const DashboardItem = ({
  title,
  code,
  imageUrl,
  imageFile,
  footer,
  mode = 'full',
  children,
  more,
  ...props
}: PropsWithChildren<DashboardItemProps>) => {
  return (
    <div className="dashboard-item" data-testid={props['data-testid']}>
      <div className="dashboard-item__block">
        {mode === 'full' && (
          <header
            className={[
              'dashboard-item__block__head',
              imageUrl ? 'dashboard-item__block__head--with-image' : '',
            ].join(' ')}
          >
            {imageFile ? (
              <img
                data-testid="dashboard-item__block__head__thumbnail"
                className="dashboard-item__block__head__thumbnail"
                sizes={imageFile.size + ''}
                src={imageFile.src}
                srcSet={imageFile.srcset}
                alt=""
              />
            ) : (
              imageUrl && (
                <img
                  data-testid="dashboard-item__block__head__thumbnail"
                  className="dashboard-item__block__head__thumbnail"
                  src={imageUrl}
                  alt=""
                />
              )
            )}
            <div className="dashboard-item__block__head__captions">
              <h5 className="dashboard-item__block__head__title">{title}</h5>
              <div className="dashboard-item__block__head__code">{code}</div>
            </div>
            {more && <DashboardItemMore more={more} />}
          </header>
        )}
        <footer className="dashboard-item__block__footer">{footer}</footer>
      </div>
      {children}
    </div>
  );
};

const DashboardItemMore = ({ more }: { more: ReactNode }) => {
  const intl = useIntl();
  const { isOpen, getToggleButtonProps, getMenuProps } = useSelect({
    items: [],
  });

  return (
    <div className="selector dashboard-item__block__head__more">
      <Button
        icon={<Icon name={IconTypeEnum.MORE} />}
        color="tertiary"
        size="small"
        aria-label={intl.formatMessage(messages.moreLabel)}
        {...getToggleButtonProps()}
      />
      <ul
        {...getMenuProps()}
        className={`selector__list ${isOpen ? '' : 'selector__list--is-closed'}`}
      >
        {isOpen && more}
      </ul>
    </div>
  );
};
