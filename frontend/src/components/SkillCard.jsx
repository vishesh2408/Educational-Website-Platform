import React from 'react';
import { motion } from 'framer-motion';
import { Star, BookOpen, Award } from 'lucide-react';

const SkillCard = ({ imageUrl, icon, title, onLearn, onQuiz }) => (
    <motion.div
        onClick={onLearn}
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="group cursor-pointer rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300 flex flex-col justify-between"
    >
        {/* Media Header */}
        {imageUrl ? (
            <div className="relative aspect-video overflow-hidden border-b border-gray-150 dark:border-white/5">
                <img
                    src={imageUrl}
                    alt={title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/600x400/7c3aed/ffffff?text=Skill';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                <div className="absolute top-4 left-4 inline-block bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-0.5 backdrop-blur-sm">
                    <span className="text-orange-500 text-[10px] font-bold tracking-wider uppercase">SKILL</span>
                </div>
            </div>
        ) : (
            <div className="relative aspect-video flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-purple-500/20 overflow-hidden border-b border-gray-150 dark:border-white/5">
                <div className="absolute w-20 h-20 bg-orange-500/10 rounded-full blur-xl animate-pulse"></div>
                <div className="relative z-10 w-16 h-16 rounded-full bg-white/10 dark:bg-white/5 border border-white/10 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                    {icon}
                </div>
                <div className="absolute top-4 left-4 inline-block bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-0.5 backdrop-blur-sm">
                    <span className="text-orange-500 text-[10px] font-bold tracking-wider uppercase">SKILL</span>
                </div>
            </div>
        )}

        {/* Content */}
        <div className="p-6 flex flex-col justify-between flex-grow">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-905 dark:text-white mb-2 line-clamp-1">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs mb-3.5 line-clamp-2">
                    Master the fundamentals and advanced details of {title} with curated reading articles, videos, and quizzes.
                </p>
                
                {/* Star Rating & Metadata */}
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-300">
                    <span className="inline-flex items-center gap-1 font-semibold text-yellow-500">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        4.7
                    </span>
                    <span className="text-gray-400 dark:text-white/20">•</span>
                    <span>1.2K Learners</span>
                </div>
            </div>

            {/* Bottom Buttons aligned like CourseCard */}
            <div className="flex items-center justify-between border-t border-gray-150 dark:border-white/5 pt-4 mt-auto">
                <span className="text-gray-905 dark:text-white text-sm font-bold">Free</span>
                <div className="flex gap-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); onLearn(); }}
                        className="text-[#167468] dark:text-teal-400 font-bold text-xs flex items-center gap-1 hover:text-teal-500 dark:hover:text-teal-300 transition-colors bg-transparent border-none cursor-pointer p-0"
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Learn</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onQuiz(); }}
                        className="text-purple-500 dark:text-purple-400 font-bold text-xs flex items-center gap-1 hover:text-purple-650 dark:hover:text-purple-300 transition-colors bg-transparent border-none cursor-pointer p-0"
                    >
                        <Award className="w-3.5 h-3.5" />
                        <span>Quiz</span>
                    </button>
                </div>
            </div>
        </div>
    </motion.div>
);

export default SkillCard;