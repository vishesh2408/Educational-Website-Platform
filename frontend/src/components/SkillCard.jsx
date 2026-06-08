


import React from 'react';
import IconWrapper from './IconWrapper';

const SkillCard = ({ icon, title, onLearn, onQuiz }) => (
    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center text-center transform translate-y-0 transition-transform hover:-translate-y-2">
        <IconWrapper>{icon}</IconWrapper>
        <h3 className="text-xl font-bold text-slate-800 mb-4">{title}</h3>
        <div className="mt-auto flex gap-2">
            <button onClick={onLearn} className="px-4 py-2 rounded-full text-sm font-semibold border-none cursor-pointer bg-teal-600 text-white transition-colors hover:bg-teal-700">Learn</button>
            <button onClick={onQuiz} className="px-4 py-2 rounded-full text-sm font-semibold border-none cursor-pointer bg-gray-200 text-gray-800 transition-colors hover:bg-gray-300">Quiz</button>
        </div>
    </div>
);

export default SkillCard;