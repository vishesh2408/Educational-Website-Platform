// import React from 'react';
// import './TrackCard.css'; // Assuming you have a CSS file for styling the track card    
// const TrackCard = ({ icon, title, onExplore }) => (
//     <div className="track-card">
//         <div className="track-card-icon">{icon}</div>
//         <h3 className="track-card-title">{title}</h3>
//         <button onClick={onExplore} className="track-card-button">
//             Explore Track
//         </button>
//     </div>
// );

// export default TrackCard;


import React from 'react';

const TrackCard = ({ icon, title, onExplore }) => (
    <div className="flex-shrink-0 w-64 bg-white rounded-lg shadow-md p-5 flex flex-col items-center text-center gap-3 snap-start transition-colors hover:shadow-lg">
        <div className="w-16 h-16">{icon}</div>
        <h3 className="font-bold text-slate-800">{title}</h3>
        <button onClick={onExplore} className="w-full mt-auto px-4 py-2 bg-gray-800 text-white rounded-full text-sm font-semibold border-none cursor-pointer transition-colors hover:bg-black">
            Explore Track
        </button>
    </div>
);

export default TrackCard;