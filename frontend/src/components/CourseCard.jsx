


import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Star, Users } from 'lucide-react';

const CourseCard = ({ course, onClick }) => {
  const badgeText = useMemo(() => {
    if (!course) return '';
    if (course.type === 'paid') return 'Premium';
    if (course.type === 'free') return 'Free';
    return course.category || '';
  }, [course]);

  const handleClick = () => {
    if (typeof onClick === 'function') onClick(course);
  };

  const hasMeta = !!(course?.duration || course?.students || course?.rating);
  const showPrice = course?.price !== undefined && course?.price !== null && String(course.price).length > 0;
  const formattedPrice = useMemo(() => {
    if (!showPrice) return '';
    const raw = course.price;
    if (String(raw).toLowerCase() === 'free') return 'Free';
    if (typeof raw === 'number') return `₹${raw}`;

    const trimmed = String(raw).trim();
    const isNumeric = /^\d+(\.\d+)?$/.test(trimmed);
    return isNumeric ? `₹${trimmed}` : trimmed;
  }, [course?.price, showPrice]);

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="group cursor-pointer rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300"
    >
      {/* Media */}
      <div className="relative aspect-video overflow-hidden">
        {course?.imageUrl ? (
          <img
            src={course.imageUrl}
            alt={course?.title || 'Course'}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/images/course-placeholder.png';
            }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-500/60 to-[#167468]/60">
            <span className="text-white text-4xl font-bold">
              {course?.title ? String(course.title).trim().charAt(0).toUpperCase() : '?'}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />

        {badgeText ? (
          <div className="absolute top-4 left-4 inline-block bg-[#167468]/10 border border-[#167468]/20 rounded-full px-4 py-1">
            <span className="text-[#167468] text-xs font-bold tracking-wider uppercase">{badgeText}</span>
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="p-6">
        {course?.title ? (
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{course.title}</h3>
        ) : null}

        {course?.description ? (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-5 line-clamp-2">{course.description}</p>
        ) : null}

        {hasMeta ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-300 mb-6">
            {course?.duration ? (
              <span className="inline-flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#167468]" />
                {course.duration}
              </span>
            ) : null}
            {course?.students ? (
              <span className="inline-flex items-center gap-2">
                <Users className="w-4 h-4 text-[#167468]" />
                {course.students}
              </span>
            ) : null}
            {course?.rating ? (
              <span className="inline-flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {course.rating}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          {showPrice ? (
            <span className="text-gray-900 dark:text-white font-bold">{formattedPrice}</span>
          ) : (
            <span />
          )}

          <button
            type="button"
            className="text-[#167468] font-bold text-sm flex items-center gap-1 hover:text-[#167468]/80 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            Learn More <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;