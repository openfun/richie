import { render } from '@testing-library/react';
import { Modal } from '.';

describe('<Modal />', () => {
  beforeEach(() => {
    const modalExclude = document.createElement('div');
    modalExclude.setAttribute('id', 'modal-exclude');
    document.body.appendChild(modalExclude);
  });

  it('merges custom classNames of type string with the default classes', () => {
    render(
      <Modal
        isOpen={true}
        className="custom-class"
        bodyOpenClassName="custom-body-open-class"
        overlayClassName="custom-overlay-class"
      />,
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
      />,
    );

    const $modal = document.querySelector('.modal.custom-class-base');
    const $overlay = document.querySelector('.modal__overlay.custom-overlay-class-base');

    expect($modal).toBeInstanceOf(HTMLDivElement);
    expect($overlay).toBeInstanceOf(HTMLDivElement);
  });
});
