import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, BookOpen, Video, FileText, Play, CheckCircle2 } from 'lucide-react';
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
  const location = useLocation();
  const [topic, setTopic] = useState(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeArticleIndex, setActiveArticleIndex] = useState(0);
  const [activeSection, setActiveSection] = useState('articles');

  useEffect(() => {
    let mounted = true;
    const fetchTopic = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const isTutorial = location.pathname.includes('/tutorials/');
        const url = isTutorial 
          ? `${API_BASE_URL}/public/tutorials/${courseId}`
          : `${API_BASE_URL}/public/courses/${courseId}`;
        const res = await fetch(url);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Failed to fetch: ${res.status}`);
        }
        const course = await res.json();
        if (!mounted) return;
        setCourseTitle(course.title || (isTutorial ? 'Tutorial' : 'Course'));
        const found = (course.modules || []).flatMap(m => m.topics || []).find(t => String(t._id) === String(topicId));
        if (!found) throw new Error(isTutorial ? 'Topic not found in this tutorial' : 'Topic not found in this course');
        setTopic(found);
        // Default to first article if articles exist
        const hasArticles = Array.isArray(found.articles) && found.articles.length > 0;
        setActiveArticleIndex(hasArticles ? 0 : -1);
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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton variant="card" count={1} />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-200">
            Error: {error}
          </div>
        </div>
      </main>
    );
  }

  if (!topic) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-6xl mx-auto text-gray-300">Topic not found.</div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="max-w-7xl mx-auto py-6">
        {/* Header with compact horizontal card */}
        <div className="px-6 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white truncate">{topic.title}</h1>
              <p className="text-sm text-gray-400">From {courseTitle}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <span className="text-xs font-semibold text-emerald-300">0%</span>
              </div>
              <button className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-500/25 transition">
                <CheckCircle2 size={18} className="text-emerald-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 px-6">
          {/* Sidebar */}
          <aside className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-4">
            {/* Tab Navigation */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => { setActiveSection('all'); setActiveArticleIndex(0); }}
                className={`w-full text-left text-sm font-medium px-4 py-2 rounded-lg transition-all border ${
                  activeSection === 'all'
                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                    : 'bg-transparent border-transparent text-gray-300 hover:bg-white/5'
                }`}
              >
                ⊞ All
              </button>
              
              <button
                onClick={() => { setActiveSection('articles'); setActiveArticleIndex(0); }}
                className={`w-full text-left text-sm font-medium px-4 py-2 rounded-lg transition-all border flex items-center gap-2 ${
                  activeSection === 'articles'
                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                    : 'bg-transparent border-transparent text-gray-300 hover:bg-white/5'
                }`}
              >
                <BookOpen size={16} />
                Articles
                {Array.isArray(topic.articles) && topic.articles.length > 0 && (
                  <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded">{topic.articles.length}</span>
                )}
              </button>

              <button
                onClick={() => setActiveSection('videos')}
                className={`w-full text-left text-sm font-medium px-4 py-2 rounded-lg transition-all border flex items-center gap-2 ${
                  activeSection === 'videos'
                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                    : 'bg-transparent border-transparent text-gray-300 hover:bg-white/5'
                }`}
              >
                <Play size={16} />
                Videos
              </button>

              <button
                onClick={() => setActiveSection('quiz')}
                className={`w-full text-left text-sm font-medium px-4 py-2 rounded-lg transition-all border flex items-center gap-2 ${
                  activeSection === 'quiz'
                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                    : 'bg-transparent border-transparent text-gray-300 hover:bg-white/5'
                }`}
              >
                <CheckCircle2 size={16} />
                Quiz
              </button>
            </div>

            {/* Content for each section */}
            <div className="space-y-2">
              {activeSection === 'articles' || activeSection === 'all' ? (
                <>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-2 mb-3">Articles ({Array.isArray(topic.articles) ? topic.articles.length : 0})</h3>
                  {Array.isArray(topic.articles) && topic.articles.length > 0 ? (
                    <nav className="space-y-1">
                      {topic.articles
                        .slice()
                        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
                        .map((article, idx) => {
                          const isActive = idx === activeArticleIndex && activeSection === 'articles';
                          return (
                            <button
                              key={article._id || idx}
                              type="button"
                              onClick={() => { setActiveSection('articles'); setActiveArticleIndex(idx); }}
                              className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-all border flex items-start gap-2 ${
                                isActive
                                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                                  : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5'
                              }`}
                            >
                              <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{article.heading || `Article ${idx + 1}`}</span>
                            </button>
                          );
                        })}
                    </nav>
                  ) : (
                    <p className="text-xs text-gray-500 px-2">No articles yet.</p>
                  )}
                </>
              ) : null}

              {activeSection === 'videos' || activeSection === 'all' ? (
                <>
                  {activeSection === 'all' && <div className="border-t border-white/10 my-4"></div>}
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-2 mb-3">Videos</h3>
                  {Array.isArray(topic.articles) && topic.articles.some(a => a.videoURL) ? (
                    <nav className="space-y-1">
                      {topic.articles
                        .filter(a => a.videoURL)
                        .map((article, idx) => (
                          <a
                            key={article._id || idx}
                            href={article.videoURL}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full text-left text-xs px-3 py-2 rounded-lg transition-all border bg-transparent border-transparent text-gray-400 hover:bg-blue-500/20 hover:border-blue-500/40 hover:text-blue-300 flex items-start gap-2"
                          >
                            <Play size={14} className="mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{article.heading || 'Video'}</span>
                          </a>
                        ))}
                    </nav>
                  ) : (
                    <p className="text-xs text-gray-500 px-2">No videos available.</p>
                  )}
                </>
              ) : null}

              {activeSection === 'quiz' || activeSection === 'all' ? (
                <>
                  {activeSection === 'all' && <div className="border-t border-white/10 my-4"></div>}
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-2 mb-3">Quiz</h3>
                  {Array.isArray(topic.articles) && topic.articles.some(a => a.quizId) ? (
                    <nav className="space-y-1">
                      {topic.articles
                        .filter(a => a.quizId)
                        .map((article, idx) => (
                          <Link
                            key={article._id || idx}
                            to={`/user/dashboard/quizzes/${article.quizId}`}
                            className="w-full text-left text-xs px-3 py-2 rounded-lg transition-all border bg-transparent border-transparent text-gray-400 hover:bg-blue-500/20 hover:border-blue-500/40 hover:text-blue-300 flex items-start gap-2"
                          >
                            <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{article.heading || 'Quiz'}</span>
                          </Link>
                        ))}
                    </nav>
                  ) : (
                    <p className="text-xs text-gray-500 px-2">No quizzes available.</p>
                  )}
                </>
              ) : null}
            </div>

            {/* Next Track */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <button className="w-full text-left text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-gray-300">
                ≫ Next Track
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="space-y-6">
            {activeSection === 'articles' ? (
              <section className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-6 md:p-10">
                {Array.isArray(topic.articles) && topic.articles.length > 0 ? (
                  <>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-white">
                        {(topic.articles[activeArticleIndex] && topic.articles[activeArticleIndex].heading) || 'Article'}
                      </h2>
                      <p className="text-sm text-gray-400 mt-2">
                        Last Updated: {(topic.articles[activeArticleIndex] && topic.articles[activeArticleIndex].updatedAt) 
                          ? new Date(topic.articles[activeArticleIndex].updatedAt).toLocaleDateString('en-CA')
                          : 'N/A'}
                      </p>
                    </div>
                    <Suspense
                      fallback={
                        <div className="flex items-center justify-center p-12 text-gray-300">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-b-purple-400"></div>
                          <span className="ml-3">Loading content…</span>
                        </div>
                      }
                    >
                      <CourseContent html={(topic.articles[activeArticleIndex] && topic.articles[activeArticleIndex].content) || ''} />
                    </Suspense>
                  </>
                ) : (
                  <div className="p-12 bg-white/5 rounded-2xl border border-white/10 text-center">
                    <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-300">No detailed content available for this topic yet.</p>
                  </div>
                )}
              </section>
            ) : activeSection === 'videos' ? (
              <section className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-6 md:p-10">
                <h2 className="text-2xl font-bold text-white mb-6">Videos</h2>
                {Array.isArray(topic.articles) && topic.articles.some(a => a.videoURL) ? (
                  <div className="grid grid-cols-1 gap-4">
                    {topic.articles
                      .filter(a => a.videoURL)
                      .map((article, idx) => (
                        <a
                          key={article._id || idx}
                          href={article.videoURL}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition"
                        >
                          <div className="w-12 h-12 rounded bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                            <Play size={20} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-medium">{article.heading || 'Video'}</h3>
                            <p className="text-xs text-gray-400 mt-1">Click to watch</p>
                          </div>
                        </a>
                      ))}
                  </div>
                ) : (
                  <div className="p-12 bg-white/5 rounded-2xl border border-white/10 text-center">
                    <Video size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-300">No videos available for this topic.</p>
                  </div>
                )}
              </section>
            ) : activeSection === 'quiz' ? (
              <section className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-6 md:p-10">
                <h2 className="text-2xl font-bold text-white mb-6">Quiz</h2>
                {Array.isArray(topic.articles) && topic.articles.some(a => a.quizId) ? (
                  <div className="grid grid-cols-1 gap-4">
                    {topic.articles
                      .filter(a => a.quizId)
                      .map((article, idx) => (
                        <Link
                          key={article._id || idx}
                          to={`/user/dashboard/quizzes/${article.quizId}`}
                          className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition"
                        >
                          <div className="w-12 h-12 rounded bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 size={20} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-medium">{article.heading || 'Quiz'}</h3>
                            <p className="text-xs text-gray-400 mt-1">Click to start</p>
                          </div>
                        </Link>
                      ))}
                  </div>
                ) : (
                  <div className="p-12 bg-white/5 rounded-2xl border border-white/10 text-center">
                    <CheckCircle2 size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-300">No quizzes available for this topic.</p>
                  </div>
                )}
              </section>
            ) : activeSection === 'all' ? (
              <section className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-6 md:p-10">
                <h2 className="text-2xl font-bold text-white mb-6">All Content</h2>
                <div className="space-y-8">
                  {/* Articles */}
                  {Array.isArray(topic.articles) && topic.articles.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Articles ({topic.articles.length})</h3>
                      <div className="space-y-2">
                        {topic.articles
                          .slice()
                          .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
                          .map((article, idx) => (
                            <button
                              key={article._id || idx}
                              onClick={() => { setActiveSection('articles'); setActiveArticleIndex(idx); }}
                              className="w-full text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition"
                            >
                              <p className="text-white font-medium">{article.heading || `Article ${idx + 1}`}</p>
                              <p className="text-xs text-gray-400 mt-1">Last Updated: {new Date(article.updatedAt).toLocaleDateString('en-CA')}</p>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                  {/* Videos */}
                  {Array.isArray(topic.articles) && topic.articles.some(a => a.videoURL) && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Videos</h3>
                      <div className="space-y-2">
                        {topic.articles
                          .filter(a => a.videoURL)
                          .map((article, idx) => (
                            <a
                              key={article._id || idx}
                              href={article.videoURL}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition flex items-center gap-2"
                            >
                              <Play size={16} className="flex-shrink-0" />
                              <p className="text-white font-medium">{article.heading || 'Video'}</p>
                            </a>
                          ))}
                      </div>
                    </div>
                  )}
                  {/* Quizzes */}
                  {Array.isArray(topic.articles) && topic.articles.some(a => a.quizId) && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Quiz</h3>
                      <div className="space-y-2">
                        {topic.articles
                          .filter(a => a.quizId)
                          .map((article, idx) => (
                            <Link
                              key={article._id || idx}
                              to={`/user/dashboard/quizzes/${article.quizId}`}
                              className="w-full text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition flex items-center gap-2"
                            >
                              <CheckCircle2 size={16} className="flex-shrink-0" />
                              <p className="text-white font-medium">{article.heading || 'Quiz'}</p>
                            </Link>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
