import React from 'react';

const IconWrapper = ({ children }) => (
  <>
    <style> 
      {`
        .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          margin-bottom: 1.25rem;
          background-color: var(--color-secondary);
          border-radius: 9999px; /* rounded-full */
          transition: background-color 0.3s ease;
        }

        body.dark-theme .icon-wrapper {
          background-color: var(--color-secondary-dark);
        }
      `}
    </style>
    <div className="icon-wrapper w-16 h-16 flex items-center justify-center mb-4">
      {children}
    </div>
  </>
);

export default IconWrapper;


