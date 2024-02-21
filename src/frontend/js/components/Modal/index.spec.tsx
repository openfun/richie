import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Modal } from '.';

describe('<Modal />', () => {
  it('merges custom classNames of type string with the default classes', () => {
    render(
      <IntlProvider locale="en">
        <Modal
          isOpen={true}
          className="custom-class"
          bodyOpenClassName="custom-body-open-class"
          overlayClassName="custom-overlay-class"
        />
      </IntlProvider>,
    );

    const $body = document.querySelector('body.has-opened-modal.custom-body-open-class');
    const $modal = document.querySelector('.modal.custom-class');
    const $overlay = document.querySelector('.modal__overlay.custom-overlay-class');

    expect($body).toBeInstanceOf(HTMLBodyElement);
    expect($modal).toBeInstanceOf(HTMLDivElement);
    expect($overlay).toBeInstanceOf(HTMLDivElement);
  });

  it('merges custom classNames of type ReactModal.Classes with the default classes', () => {
    render(
      <IntlProvider locale="en">
        <Modal
          isOpen={true}
          className={{
            base: 'custom-class-base',
            afterOpen: 'custom-class-afterOpen',
            beforeClose: 'custom-class-beforeClose',
          }}
          overlayClassName={{
            base: 'custom-overlay-class-base',
            afterOpen: 'custom-overlay-class-afterOpen',
            beforeClose: 'custom-overlay-class-beforeClose',
          }}
        />
      </IntlProvider>,
    );

    const $modal = document.querySelector('.modal.custom-class-base');
    const $overlay = document.querySelector('.modal__overlay.custom-overlay-class-base');

    expect($modal).toBeInstanceOf(HTMLDivElement);
    expect($overlay).toBeInstanceOf(HTMLDivElement);
  });

  it('displays close button', () => {
    render(
      <IntlProvider locale="en">
        <Modal isOpen={true} />
      </IntlProvider>,
    );

    screen.getByRole('button', { name: 'Close dialog' });
  });

  it('has no close button', () => {
    render(
      <IntlProvider locale="en">
        <Modal isOpen={true} hasCloseButton={false} />
      </IntlProvider>,
    );

    expect(screen.queryByRole('button', { name: 'Close dialog' })).toBeNull();
  });

  it('displays title', () => {
    render(
      <IntlProvider locale="en">
        <Modal isOpen={true} title={<div data-testid="custom__header">Hi there</div>} />
      </IntlProvider>,
    );

    screen.getByTestId('custom__header');
  });

  it('displays title in h2 if it is a string', () => {
    render(
      <IntlProvider locale="en">
        <Modal isOpen={true} title="Hello world" />
      </IntlProvider>,
    );
    screen.getByRole('heading', { level: 2, name: 'Hello world' });
  });
});
