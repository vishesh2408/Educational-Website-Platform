

import React from 'react';

const SectionTitle = ({ children, className = '' }) => (
    <h2
        className={`text-3xl md:text-4xl font-bold text-center mb-12 relative text-slate-800 dark:text-white ${className}`}
    >
        {children}
        <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full" />
    </h2>
);

export default SectionTitle;