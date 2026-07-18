import React from 'react';
import { motion } from 'framer-motion';
import { Star, Compass, ArrowRight } from 'lucide-react';

const TrackCard = ({ imageUrl, icon, title, onExplore }) => (
    <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="flex-shrink-0 w-72 md:w-80 cursor-pointer rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300 flex flex-col justify-between"
        onClick={onExplore}
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
                        e.currentTarget.src = 'https://placehold.co/600x400/0ea5e9/ffffff?text=Track';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                <div className="absolute top-4 left-4 inline-block bg-teal-500/10 border border-teal-500/20 rounded-full px-3 py-0.5 backdrop-blur-sm">
                    <span className="text-teal-605 dark:text-teal-400 text-[10px] font-bold tracking-wider uppercase">TRACK</span>
                </div>
            </div>
        ) : (
            <div className="relative aspect-video flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-teal-500/20 overflow-hidden border-b border-gray-150 dark:border-white/5">
                <div className="absolute w-20 h-20 bg-teal-500/10 rounded-full blur-xl animate-pulse"></div>
                <div className="relative z-10 w-16 h-16 rounded-full bg-white/10 dark:bg-white/5 border border-white/10 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                    {icon}
                </div>
                <div className="absolute top-4 left-4 inline-block bg-teal-500/10 border border-teal-500/20 rounded-full px-3 py-0.5 backdrop-blur-sm">
                    <span className="text-teal-605 dark:text-teal-400 text-[10px] font-bold tracking-wider uppercase">TRACK</span>
                </div>
            </div>
        )}

        {/* Content */}
        <div className="p-6 flex flex-col justify-between flex-grow">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-905 dark:text-white mb-2 line-clamp-1">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs mb-3.5 line-clamp-2">
                    Master the structured {title} path. Build production-ready projects and master industrial developer practices.
                </p>
                
                {/* Star Rating & Metadata */}
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-300">
                    <span className="inline-flex items-center gap-1 font-semibold text-yellow-505">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        4.9
                    </span>
                    <span className="text-gray-400 dark:text-white/20">•</span>
                    <span>2.4K Learners</span>
                </div>
            </div>

            {/* Bottom Buttons aligned like CourseCard */}
            <div className="flex items-center justify-between border-t border-gray-150 dark:border-white/5 pt-4 mt-auto">
                <span className="text-gray-905 dark:text-white text-sm font-bold">Free</span>
                <button
                    onClick={(e) => { e.stopPropagation(); onExplore(); }}
                    className="text-[#167468] dark:text-teal-400 font-bold text-xs flex items-center gap-1 hover:text-teal-500 dark:hover:text-teal-300 transition-colors bg-transparent border-none cursor-pointer p-0"
                >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Explore Track</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    </motion.div>
);

export default TrackCard;