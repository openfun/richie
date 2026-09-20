import { EnrollmentAwarenessMessage } from 'utils/enrollmentAwareness';

interface EnrollmentAwarenessMessagesProps {
  messages: EnrollmentAwarenessMessage[];
}

/**
 * Display the messages of the enrollment awareness rules matching a course run, next to the
 * enrollment call to action.
 */
const EnrollmentAwarenessMessages = ({ messages }: EnrollmentAwarenessMessagesProps) => {
  if (messages.length === 0) {
    return null;
  }

  return (
    <ul className="enrollment-awareness">
      {messages.map((message) => (
        <li
          key={message.id}
          className={`enrollment-awareness__message enrollment-awareness__message--${message.variant}`}
          role={message.variant === 'warning' ? 'alert' : undefined}
        >
          {message.text}
        </li>
      ))}
    </ul>
  );
};

export default EnrollmentAwarenessMessages;
