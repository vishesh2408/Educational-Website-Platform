


import React from 'react';
import { Clock, Users, Star } from 'lucide-react';

const CourseCard = ({ course, onClick }) => {
  return (
    <div 
      className="bg-card dark:bg-color-card-bg-dark border border-border dark:border-color-border-dark rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onClick={() => onClick(course)}
    >
      <div className="aspect-video bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
            {course.imageUrl ? (
              <img
                src={course.imageUrl}
                alt={course.title}
                className="object-cover w-full h-full"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/course-placeholder.png'; }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-white text-3xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                {course.title ? course.title[0] : '?'}
              </div>
            )}
      </div>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">{course.title}</h3>
        <p className="text-muted-foreground dark:text-slate-300 text-sm mb-4 line-clamp-2">{course.description || "Comprehensive course covering all essential topics."}</p>
        
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{course.duration || "8 weeks"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{course.students || "1.2k"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{course.rating || "4.8"}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-teal-600 dark:text-teal-300">
            {course.price === 'Free' ? 'Free' : `$${course.price || '99'}`}
          </span>
          <span className="text-sm px-2 py-1 bg-muted dark:bg-gray-700 rounded-full text-muted-foreground dark:text-slate-300">
            {course.type === 'paid' ? 'Premium' : 'Free'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;