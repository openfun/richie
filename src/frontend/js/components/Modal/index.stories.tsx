import { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal } from './index';

export default {
  component: Modal,
  argTypes: {
    shouldCloseOnOverlayClick: {
      control: 'boolean',
    },
    shouldCloseOnEsc: {
      control: 'boolean',
    },
    title: {
      control: 'text',
    },
  },
  render: (args) => {
    const [modalIsOpen, setModalIsOpen] = useState(true);

    return (
      <>
        <button onClick={() => setModalIsOpen(true)}>Open modal</button>
        <Modal {...args} isOpen={modalIsOpen} onRequestClose={() => setModalIsOpen(false)}>
          <div style={{ padding: '20px' }}>
            {[...Array(50)].map(() => (
              <div>Any content you want here.</div>
            ))}
          </div>
        </Modal>
      </>
    );
  },
} as Meta<typeof Modal>;

type Story = StoryObj<typeof Modal>;

export const Default: Story = {};
