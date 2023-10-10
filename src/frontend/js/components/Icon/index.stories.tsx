import { Meta, StoryObj } from '@storybook/react';
import { PropsWithChildren, useState, useRef, CSSProperties } from 'react';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { Icon, IconTypeEnum } from './index';

export default {
  component: Icon,
} as Meta<typeof Icon>;

type Story = StoryObj<typeof Icon>;

export const Default: Story = {
  args: {
    name: IconTypeEnum.CHECK,
  },
};

const IconList = ({ children }: PropsWithChildren) => {
  const style: CSSProperties = {
    display: 'grid',
    gap: '1rem',
    gridTemplateColumns: 'repeat(4, minmax(max-content, 1fr))',
  };
  return <div style={style}>{children}</div>;
};
type IconContainerProps = {
  name: IconTypeEnum;
  enumKey: string;
};
const IconContainer = ({ name, enumKey }: IconContainerProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const ENUM_NAME = 'IconTypeEnum';

  const styleContainer: CSSProperties = {
    padding: '10px',
    border: '1px solid black',
    borderRadius: '6px',
    display: 'flex',
    flex: '0 25%',
    background: 'white',
    position: 'relative',
  };
  const styleIcon: CSSProperties = {};
  const styleDescription: CSSProperties = {
    marginLeft: '10px',
    alignSelf: 'center',
    color: '#686f7a',
  };
  const styleTooltip: CSSProperties = {
    position: 'absolute',
    top: '50%',
    right: 12,
    animation: 'fade-in 0.5s ease-in-out',
    backgroundColor: '#f72c30',
    color: 'white',
    borderRadius: '50vw',
    fontSize: '0.625rem',
    padding: '2px 6px',
    fontWeight: 700,
    opacity: 0,
    transition: 'opacity 0.2s ease-in-out, transform 0.2s 0.05s ease-in-out',
    transform: 'translateY(-100%)',
    pointerEvents: 'none',
  };
  const styleTooltipVisible = {
    opacity: 1,
    transform: 'translateY(-50%)',
  };

  const clipboardCopy = () => {
    navigator.clipboard.writeText(`${ENUM_NAME}.${enumKey}`);
    setShowTooltip(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, HttpStatusCode.INTERNAL_SERVER_ERROR);
  };

  return (
    <button onClick={clipboardCopy} style={styleContainer} title="Click to copy icon ref">
      <div style={styleIcon}>
        <Icon name={name} />
      </div>
      <div style={styleDescription}>{name}</div>
      <div
        style={{
          ...styleTooltip,
          ...(showTooltip ? styleTooltipVisible : {}),
        }}
      >
        Copied
      </div>
    </button>
  );
};

export const AllIcons: Story = {
  render: () => {
    return (
      <IconList>
        {Object.entries(IconTypeEnum).map(([enumKey, name]) => (
          <IconContainer enumKey={enumKey} name={name} />
        ))}
      </IconList>
    );
  },
};
