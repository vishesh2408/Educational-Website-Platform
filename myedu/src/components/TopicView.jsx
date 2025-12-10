import React, { useEffect, useState, useMemo, Suspense, lazy } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Video, FileText } from 'lucide-react';
import Skeleton from './Skeleton';
import MarkdownIt from 'markdown-it';
const CourseContent = lazy(() => import('./CourseContent'));

// const API_BASE_URL = 'http://localhost:3001/api';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;


const md = new MarkdownIt({ html: true, breaks: true, linkify: true });
const slugify = (text) =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export default function TopicView() {
  const { id: courseId, topicId } = useParams();
  const [topic, setTopic] = useState(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchTopic = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/public/courses/${courseId}`);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Failed to fetch course: ${res.status}`);
        }
        const course = await res.json();
        if (!mounted) return;
        setCourseTitle(course.title || 'Course');
        const found = (course.modules || []).flatMap(m => m.topics || []).find(t => String(t._id) === String(topicId));
        if (!found) throw new Error('Topic not found in this course');
        setTopic(found);
      } catch (err) {
        console.error('Topic fetch error:', err);
        if (mounted) setError(err.message || 'Failed to load topic');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchTopic();
    return () => { mounted = false; };
  }, [courseId, topicId]);

  // Calculate TOC items BEFORE early returns (hooks must run unconditionally)
  const tocItems = useMemo(() => {
    if (!topic?.notes) return [];
    try {
      const html = md.render(topic.notes);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'))
        .map((h) => {
          const text = (h.textContent || '').trim();
          const level = Number(h.tagName?.slice(1)) || 2;
          const id = slugify(text);
          return id && text ? { id, text, level } : null;
        })
        .filter(Boolean);
    } catch (e) {
      return [];
    }
  }, [topic?.notes]);

  if (isLoading) return <div className="p-6"><Skeleton variant="card" count={1} /></div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!topic) return <div className="p-6">Topic not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50 dark:from-gray-900 dark:to-slate-900 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-0 left-0 w-[30rem] h-[30rem] bg-teal-700/40 rounded-full blur-3xl opacity-40 animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-[25rem] h-[25rem] bg-teal-400/40 rounded-full blur-3xl opacity-40 animate-blob animation-delay-2000"></div>

      <main className="max-w-8xl mx-auto bg-teal-500 p-4 md:p-2 relative z-10">
        {/* Back Button */}
        <Link 
          to="/user/dashboard/courses" 
          className="inline-flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors mb-6"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Courses
        </Link>

        {/* Glassmorphic Header */}
        <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-3xl p-6 md:p-8 mb-8 shadow-lg flex items-center gap-6">
          <div className="flex-shrink-0 text-teal-700 dark:text-teal-400">
            <BookOpen size={56} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2">
              {topic.title}
            </h1>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-300">
              From <span className="font-semibold text-slate-800 dark:text-slate-200">{courseTitle}</span>
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          
          {/* Sidebar TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 bg-white/80 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-md">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
                On This Page
              </h2>
              {tocItems.length ? (
                <nav className="space-y-1">
                  {tocItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block text-sm px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-700/60 hover:text-teal-700 dark:hover:text-teal-300 transition-all duration-200 border-l-2 border-transparent hover:border-teal-500"
                      style={{ 
                        paddingLeft: `${12 + (item.level - 1) * 12}px`,
                        fontSize: item.level === 1 ? '0.875rem' : '0.8125rem',
                        fontWeight: item.level <= 2 ? '500' : '400',
                      }}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">No headings found</p>
              )}
            </div>
          </aside>

          {/* Main Content - A4 Width (8.27 inches = ~791px) */}
          <div className="w-full max-w-[850px] space-y-6">
            <section className="bg-white/50 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-10 shadow-md">
              {topic.notes ? (
                <Suspense fallback={
                  <div className="flex items-center justify-center p-12 text-slate-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    <span className="ml-3">Loading notes…</span>
                  </div>
                }>
                  <CourseContent html={topic.notes} />
                </Suspense>
              ) : (
                <div className="p-12 bg-slate-50/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                  <FileText size={48} className="mx-auto mb-4 text-slate-400" />
                  <p className="text-slate-600 dark:text-slate-400">No detailed notes available for this topic yet.</p>
                </div>
              )}
            </section>

            {/* Action Buttons */}
            {(topic.videoUrl || topic.quizId) && (
              <div className="flex flex-wrap gap-4">
                {topic.videoUrl && (
                  <a 
                    href={topic.videoUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Video size={20} className="mr-2" />
                    Watch Video
                  </a>
                )}
                {topic.quizId && (
                  <Link 
                    to={`/user/dashboard/quizzes/${topic.quizId}`} 
                    className="inline-flex items-center px-6 py-3 bg-white dark:bg-slate-800 border-2 border-teal-600 dark:border-teal-400 text-teal-700 dark:text-teal-300 font-semibold rounded-full hover:bg-teal-50 dark:hover:bg-slate-700 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <span className="mr-2">✓</span>
                    Start Quiz
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.05); }
          50% { transform: translate(40px, -40px) scale(1.1); }
          75% { transform: translate(20px, -20px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
