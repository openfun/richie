import { ComponentMeta, ComponentStory } from '@storybook/react';
import { useState } from 'react';
import { Modal } from './index';
import { Icon } from '../Icon';

export default {
  title: 'Components/Modal',
  component: Modal,
  argTypes: {
    shouldCloseOnOverlayClick: {
      control: 'boolean',
    },
    shouldCloseOnEsc: {
      control: 'boolean',
    },
  },
} as ComponentMeta<typeof Modal>;

const Template: ComponentStory<typeof Modal> = (args) => {
  const [modalIsOpen, setModalIsOpen] = useState(true);

  return (
    <>
      <button onClick={() => setModalIsOpen(true)}>Open modal</button>
      <Modal {...args} isOpen={modalIsOpen} onRequestClose={() => setModalIsOpen(false)}>
        <button
          className="modal__closeButton search-filter-group-modal__close"
          onClick={() => setModalIsOpen(false)}
        >
          <span className="offscreen">Close</span>
          <Icon
            name="icon-cross"
            className="modal__closeButton__icon search-filter-group-modal__close__icon"
          />
        </button>
        <div style={{ padding: '20px' }}>Any content you want here.</div>
      </Modal>
    </>
  );
};

export const Default = Template.bind({});
