import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
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

const getYoutubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const LiveClassCard = ({ lc }) => {
  const [showDetails, setShowDetails] = useState(false);
  const isLive = lc.status === 'live';
  return (
    <div className={`p-4 rounded-xl border backdrop-blur flex flex-col gap-3 transition-all ${
      isLive 
        ? 'bg-red-500/5 border-red-500/20 shadow-md shadow-red-500/5' 
        : 'bg-white/5 border-white/10 hover:border-white/20'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
              isLive ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-white'
            }`}>
              {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
              {lc.status.toUpperCase()} SESSION
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {new Date(lc.scheduledAt).toLocaleString()} {lc.duration ? `(${lc.duration})` : ''}
            </span>
          </div>
          <h4 className="text-sm font-bold text-white leading-tight">{lc.title}</h4>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-xs font-semibold transition cursor-pointer text-gray-200"
          >
            {showDetails ? 'Hide Details' : 'Details'}
          </button>
          {isLive ? (
            <a
              href={lc.streamURL || '#'}
              target={lc.streamURL ? "_blank" : "_self"}
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-md shadow-red-600/10 cursor-pointer"
            >
              <Play size={10} fill="white" /> Join Stream
            </a>
          ) : (
            <button
              disabled
              className="px-3.5 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold cursor-not-allowed text-center"
            >
              Start Stream
            </button>
          )}
        </div>
      </div>
      {showDetails && (
        <div className="border-t border-white/10 pt-3 text-xs text-gray-300 animate-slideDown">
          <h5 className="font-semibold text-white mb-1">Session Description:</h5>
          <p className="whitespace-pre-wrap">{lc.description || 'No description provided for this session.'}</p>
        </div>
      )}
    </div>
  );
};

export default function TopicView() {
  const { id: courseId, topicId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeArticleIndex, setActiveArticleIndex] = useState(0);
  const [activeSection, setActiveSection] = useState('articles');
  const [liveClasses, setLiveClasses] = useState([]);
  const [assignedQuizzes, setAssignedQuizzes] = useState([]);

  const topicLiveClasses = liveClasses.filter(lc => String(lc.topicId) === String(topicId));

  const getVideos = () => {
    const articleVideos = (topic && Array.isArray(topic.articles))
      ? topic.articles.filter(a => a.videoURL).map(a => ({ title: a.heading || 'Video', videoURL: a.videoURL }))
      : [];
    const dedicatedVideos = (topic && Array.isArray(topic.videos))
      ? topic.videos.map(v => ({ title: v.title || 'Video', videoURL: v.videoURL }))
      : [];
    const completedLiveVideos = topicLiveClasses
      .filter(lc => lc.status === 'completed')
      .map(lc => ({ title: `[Live Class Recording] ${lc.title}`, videoURL: lc.streamURL }));
    return [...articleVideos, ...dedicatedVideos, ...completedLiveVideos];
  };
  const topicVideos = getVideos();

  useEffect(() => {
    let mounted = true;
    const fetchTopicAndLiveClasses = async () => {
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

        // Fetch live classes for this course if not a tutorial
        if (!isTutorial) {
          try {
            const liveRes = await fetch(`${API_BASE_URL}/live-classes/course/${courseId}`, {
              credentials: 'include'
            });
            if (liveRes.ok) {
              const liveData = await liveRes.json();
              if (mounted) setLiveClasses(liveData);
            }
          } catch (err) {
            console.error('Error fetching live classes for course:', err);
          }
        }

        // Fetch public quizzes and filter by topicId
        try {
          const quizRes = await fetch(`${API_BASE_URL}/public/quizzes`);
          if (quizRes.ok) {
            const quizData = await quizRes.json();
            if (mounted) {
              const filtered = quizData.filter(q => String(q.topicId) === String(topicId));
              setAssignedQuizzes(filtered);
            }
          }
        } catch (err) {
          console.error('Error fetching quizzes:', err);
        }
      } catch (err) {
        console.error('Topic fetch error:', err);
        if (mounted) setError(err.message || 'Failed to load topic');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchTopicAndLiveClasses();
    return () => { mounted = false; };
  }, [courseId, topicId, location.pathname]);

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
        {/* Back Button + Header */}
        <div className="px-6 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-3 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to {courseTitle}
          </button>
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
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 px-6 items-start">
          {/* Sidebar */}
          <aside className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-4 md:sticky md:top-6 md:max-h-[calc(100vh-3rem)] md:overflow-y-auto">
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
                  {(topicVideos.length > 0 || topicLiveClasses.length > 0) ? (
                    <nav className="space-y-1">
                      {/* Active / Scheduled Live Classes in Sidebar */}
                      {topicLiveClasses.filter(lc => lc.status === 'live' || lc.status === 'upcoming').map((lc) => (
                        <button
                          key={`live-${lc._id}`}
                          onClick={() => { setActiveSection('videos'); }}
                          className="w-full text-left text-xs px-3 py-2 rounded-lg transition-all border bg-transparent border-transparent text-gray-400 hover:bg-blue-500/20 hover:border-blue-500/40 hover:text-blue-300 flex items-start gap-2 cursor-pointer"
                        >
                          <Video size={14} className="mt-0.5 flex-shrink-0 text-teal-400" />
                          <span className="line-clamp-2 font-medium text-left">
                            <span className={lc.status === 'live' ? 'text-red-400 font-bold' : 'text-blue-400'}>
                              [{lc.status.toUpperCase()}]
                            </span>{' '}
                            {lc.title}
                          </span>
                        </button>
                      ))}
                      {/* Standard Videos in Sidebar */}
                      {topicVideos.map((video, idx) => (
                        <a
                          key={`video-${idx}`}
                          href={video.videoURL}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full text-left text-xs px-3 py-2 rounded-lg transition-all border bg-transparent border-transparent text-gray-400 hover:bg-blue-500/20 hover:border-blue-500/40 hover:text-blue-300 flex items-start gap-2"
                        >
                          <Play size={14} className="mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{video.title}</span>
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
                  {(assignedQuizzes.length > 0 || (Array.isArray(topic.articles) && topic.articles.some(a => a.quizId))) ? (
                    <nav className="space-y-1">
                      {/* Assigned Quizzes in Sidebar */}
                      {assignedQuizzes.map((quiz) => (
                        <Link
                          key={`assigned-quiz-${quiz._id}`}
                          to={`/user/dashboard/quizzes/${quiz._id}`}
                          className="w-full text-left text-xs px-3 py-2 rounded-lg transition-all border bg-transparent border-transparent text-gray-400 hover:bg-blue-500/20 hover:border-blue-500/40 hover:text-blue-300 flex items-start gap-2"
                        >
                          <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-purple-400" />
                          <span className="line-clamp-2 font-medium">{quiz.title}</span>
                        </Link>
                      ))}
                      {/* Article-level Quizzes in Sidebar */}
                      {topic.articles
                        ?.filter(a => a.quizId)
                        ?.map((article, idx) => (
                          <Link
                            key={`article-quiz-${article._id || idx}`}
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

          <div className="space-y-6 max-w-[210mm] md:max-h-[calc(100vh-3rem)] md:overflow-y-auto md:pr-2" style={{ scrollbarGutter: 'stable' }}>
            {/* Live/Upcoming Session Banners */}
            {topicLiveClasses.filter(lc => lc.status === 'live' || lc.status === 'upcoming').map(lc => (
              <div key={lc._id} className={`p-5 rounded-2xl border backdrop-blur flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fadeIn ${
                lc.status === 'live'
                  ? 'bg-red-500/10 border-red-500/30 text-red-200 shadow-lg shadow-red-500/5'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-200 shadow-lg shadow-blue-500/5'
              }`}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                      lc.status === 'live' ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-white'
                    }`}>
                      {lc.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                      {lc.status.toUpperCase()} SESSION
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {new Date(lc.scheduledAt).toLocaleString()} ({lc.duration})
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white leading-tight">{lc.title}</h4>
                  {lc.description && <p className="text-xs text-gray-300 line-clamp-2">{lc.description}</p>}
                </div>
                <div className="w-full md:w-auto flex shrink-0">
                  {lc.status === 'live' ? (
                    <a
                      href={lc.streamURL}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full md:w-auto text-center px-4 py-2 rounded-xl bg-red-650 hover:bg-red-750 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-red-600/10"
                    >
                      <Play size={14} fill="white" /> Join Live Stream
                    </a>
                  ) : (
                    <button
                      disabled
                      className="w-full md:w-auto px-4 py-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold cursor-not-allowed text-center"
                    >
                      Starts {new Date(lc.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  )}
                </div>
              </div>
            ))}

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
                
                {(topicLiveClasses.length > 0 || topicVideos.length > 0) ? (
                  <div className="space-y-8">
                    {/* Live & Scheduled Classes */}
                    {topicLiveClasses.filter(lc => lc.status === 'live' || lc.status === 'upcoming').length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400">Live & Scheduled Sessions</h3>
                        <div className="grid grid-cols-1 gap-4">
                          {topicLiveClasses.filter(lc => lc.status === 'live' || lc.status === 'upcoming').map(lc => (
                            <LiveClassCard key={lc._id} lc={lc} />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Uploaded / Completed Videos */}
                    {topicVideos.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">Uploaded Videos & Recordings</h3>
                        <div className="grid grid-cols-1 gap-6">
                          {topicVideos.map((video, idx) => {
                            const ytId = getYoutubeId(video.videoURL);
                            return (
                              <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                  <Play size={16} className="text-purple-400" />
                                  {video.title}
                                </h3>
                                {ytId ? (
                                  <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-white/5 bg-black">
                                    <iframe
                                      className="absolute inset-0 w-full h-full"
                                      src={`https://www.youtube.com/embed/${ytId}`}
                                      title={video.title}
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    ></iframe>
                                  </div>
                                ) : (
                                  <a
                                    href={video.videoURL}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-3 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg hover:bg-white/10 transition"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                                        <Play size={16} className="text-white" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-white">{video.title}</p>
                                        <p className="text-xs text-gray-400">External Video Link</p>
                                      </div>
                                    </div>
                                    <span className="text-xs text-blue-400 hover:underline">Watch External ↗</span>
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
                {(assignedQuizzes.length > 0 || (Array.isArray(topic.articles) && topic.articles.some(a => a.quizId))) ? (
                  <div className="grid grid-cols-1 gap-4">
                    {/* Assigned Quizzes */}
                    {assignedQuizzes.map((quiz) => (
                      <Link
                        key={`assigned-quiz-main-${quiz._id}`}
                        to={`/user/dashboard/quizzes/${quiz._id}`}
                        className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition"
                      >
                        <div className="w-12 h-12 rounded bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 size={20} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{quiz.title}</h3>
                          <p className="text-xs text-gray-400 mt-1">
                            {quiz.noOfQuestions} Questions | {quiz.totalMarks} Marks | {quiz.duration || 'No Time Limit'}
                          </p>
                        </div>
                        <span className="text-xs text-purple-400 font-semibold px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/20">Assigned Quiz</span>
                      </Link>
                    ))}
                    
                    {/* Article Quizzes */}
                    {topic.articles
                      ?.filter(a => a.quizId)
                      ?.map((article, idx) => (
                        <Link
                          key={`article-quiz-main-${article._id || idx}`}
                          to={`/user/dashboard/quizzes/${article.quizId}`}
                          className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition"
                        >
                          <div className="w-12 h-12 rounded bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 size={20} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-medium">{article.heading || 'Quiz'}</h3>
                            <p className="text-xs text-gray-400 mt-1">Topic Article Quiz | Click to start</p>
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
                  {topicVideos.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Videos</h3>
                      <div className="space-y-2">
                        {topicVideos.map((video, idx) => (
                          <a
                            key={idx}
                            href={video.videoURL}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition flex items-center gap-2"
                          >
                            <Play size={16} className="flex-shrink-0" />
                            <p className="text-white font-medium">{video.title}</p>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Quizzes */}
                  {(assignedQuizzes.length > 0 || (Array.isArray(topic.articles) && topic.articles.some(a => a.quizId))) && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Quiz</h3>
                      <div className="space-y-2">
                        {/* Assigned Quizzes */}
                        {assignedQuizzes.map((quiz) => (
                          <Link
                            key={`assigned-quiz-all-${quiz._id}`}
                            to={`/user/dashboard/quizzes/${quiz._id}`}
                            className="w-full text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition flex items-center gap-2"
                          >
                            <CheckCircle2 size={16} className="flex-shrink-0 text-purple-400" />
                            <p className="text-white font-medium">{quiz.title} <span className="text-xs text-purple-400 ml-2">(Assigned Quiz)</span></p>
                          </Link>
                        ))}
                        {/* Article Quizzes */}
                        {topic.articles
                          ?.filter(a => a.quizId)
                          ?.map((article, idx) => (
                            <Link
                              key={`article-quiz-all-${article._id || idx}`}
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
