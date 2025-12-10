// import React from 'react';

// const SectionTitle = ({ children }) => (
//     <h2 className="section-title">
//         {children}
//         <span className="section-title-underline"></span>
//     </h2>
// );

// export default SectionTitle;


import React from 'react';

const SectionTitle = ({ children }) => (
    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-slate-800 relative">
        {children}
        <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"></span>
    </h2>
);

export default SectionTitle;