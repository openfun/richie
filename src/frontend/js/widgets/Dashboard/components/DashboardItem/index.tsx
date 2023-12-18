import { PropsWithChildren, ReactNode } from 'react';
import { JoanieFile } from 'types/Joanie';
import { Nullable, PropsWithTestId } from 'types/utils';

export type DashboardItemProps = PropsWithTestId<{
  title: ReactNode;
  code?: string;
  imageUrl?: string;
  imageFile?: Nullable<JoanieFile>;
  footer?: ReactNode;
  mode?: 'full' | 'compact';
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
          </header>
        )}
        <footer className="dashboard-item__block__footer">{footer}</footer>
      </div>
      {children}
    </div>
  );
};
