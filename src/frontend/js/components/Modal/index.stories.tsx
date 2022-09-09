import { ComponentMeta, ComponentStory } from '@storybook/react';
import { useState } from 'react';
import { Modal } from './index';

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
    title: {
      control: 'text',
    },
  },
} as ComponentMeta<typeof Modal>;

const Template: ComponentStory<typeof Modal> = (args) => {
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
};

export const Default = Template.bind({});
