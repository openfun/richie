const WarningIcon = () => {
  return (
    <svg className="warning-icon" role="img" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle className="circle back" cx="16" cy="16" r="14" />
      <circle className="circle" cx="16" cy="16" r="14" />
      <g className="exclamation-mark back">
        <path d="M16 8V19" />
        <circle cx="16" cy="23" r="1" />
      </g>
      <g className="exclamation-mark">
        <path d="M16 8V19" />
        <circle cx="16" cy="23" r="1" />
      </g>
    </svg>
  );
};

export default WarningIcon;
