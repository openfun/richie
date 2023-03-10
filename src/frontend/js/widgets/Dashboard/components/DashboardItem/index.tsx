import { PropsWithChildren, ReactNode } from 'react';
import { PropsWithTestId } from 'types/utils';

type Props = PropsWithTestId<{
  title: string;
  code: string;
  imageUrl?: string;
  footer?: ReactNode;
}>;

// This is temporary due to the fact that backend doesn't give this attribute yet.
export const DEMO_IMAGE_URL =
  'https://dz03nossv7tsm.cloudfront.net/media/filer_public_thumbnails/filer_public/12/32/123267a1-bc28-49ca-bfca-679568c34043/logo_upsaclay-2020.jpg__200x113_q85_replace_alpha-%23FFFFFF_subsampling-2_upscale.jpg';

export const DashboardItem = (props: PropsWithChildren<Props>) => {
  return (
    <div className="dashboard-item" data-testid={props['data-testid']}>
      <div className="dashboard-item__block">
        <header
          className={[
            'dashboard-item__block__head',
            props.imageUrl ? 'dashboard-item__block__head--with-image' : '',
          ].join(' ')}
        >
          {!!props.imageUrl && (
            <img
              data-testid="dashboard-item__block__head__thumbnail"
              className="dashboard-item__block__head__thumbnail"
              src={props.imageUrl}
              alt=""
            />
          )}
          <div className="dashboard-item__block__head__captions">
            <h5 className="dashboard-item__block__head__title">{props.title}</h5>
            <div className="dashboard-item__block__head__code">{props.code}</div>
          </div>
        </header>
        <footer className="dashboard-item__block__footer">{props.footer}</footer>
      </div>
      {props.children}
    </div>
  );
};
