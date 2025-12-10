
import React from 'react';
import SectionTitle from './SectionTitle'; // Import SectionTitle

const PageSection = ({title, children}) => (
  <div className="container page-section-padding">
    <style>
      {`
       /* General Page Sections */
.page-content-box {
  background-color: var(--color-card-bg-light);
  border-radius: 0.5rem; /* rounded-lg */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* shadow-md */
  padding: 2rem; /* p-8 */
  transition: background-color 0.3s ease;
}

body.dark-theme .page-content-box {
  background-color: var(--color-card-bg-dark);
}
      `}
    </style>
    <SectionTitle>{title}</SectionTitle>
    <div className="page-content-box">
      {children}
    </div>
  </div>
);

export default PageSection;
