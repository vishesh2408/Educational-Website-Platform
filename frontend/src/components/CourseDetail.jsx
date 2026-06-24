import React, { useEffect, useState } from 'react';
import Skeleton from './Skeleton';
import { useParams, Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Video, Calendar, Clock } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [liveClasses, setLiveClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const fetchCourse = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/public/courses/${id}`);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Failed to fetch course: ${res.status}`);
        }
        const data = await res.json();
        if (mounted) {
          setCourse(data);
          // Initialize all modules as collapsed by default
          if (data.modules && Array.isArray(data.modules)) {
            const initialExpanded = {};
            data.modules.forEach(mod => {
              initialExpanded[mod._id] = false;
            });
            setExpandedModules(initialExpanded);
          }
        }

        // Fetch Live Classes for this course (fails silently if student not enrolled)
        try {
          const liveRes = await fetch(`${API_BASE_URL}/api/live-classes/course/${id}`, {
            credentials: 'include'
          });
          if (liveRes.ok) {
            const liveData = await liveRes.json();
            if (mounted) setLiveClasses(liveData);
          }
        } catch (liveErr) {
          console.error('Error fetching live classes:', liveErr);
        }

      } catch (err) {
        console.error('Course detail fetch error:', err);
        if (mounted) setError(err.message || 'Failed to load course');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchCourse();
    return () => { mounted = false; };
  }, [id]);

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white py-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton variant="card" count={2} />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 text-white py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-200">
            Error: {error}
          </div>
        </div>
      </main>
    );
  }

  if (!course) {
    return (
      <main className="min-h-screen bg-slate-950 text-white py-6">
        <div className="max-w-4xl mx-auto text-gray-300">Course not found.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white py-4">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-4 bg-white/5 border border-white/10 backdrop-blur rounded-xl px-4 py-3">
          <h1 className="text-2xl font-bold mb-1 text-white">{course.title}</h1>
          <p className="text-sm text-gray-300">{course.description}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-white/5 border border-white/10 text-gray-200">
              {course.type === 'paid' ? 'Premium' : 'Free'}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-white/5 border border-white/10 text-gray-200">
              {course.price && `₹${course.price}`}
            </span>
          </div>
        </header>

        {/* Live Classes Section */}
        {liveClasses && liveClasses.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Live & Scheduled Sessions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveClasses.map((live) => (
                <div key={live._id} className="p-4 bg-white/5 border border-white/10 backdrop-blur rounded-xl flex flex-col justify-between hover:border-white/20 transition-all duration-300">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold text-sm text-white flex items-center gap-1.5">
                        <Video size={16} className={live.status === 'live' ? 'text-red-500' : 'text-teal-400'} />
                        {live.title}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        live.status === 'live' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        live.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {live.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
                        {live.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{live.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px] text-gray-300">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-teal-500" />
                        {new Date(live.scheduledAt).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-teal-500" />
                        {live.duration}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    {live.status === 'completed' ? (
                      <button disabled className="w-full text-center text-xs font-semibold text-gray-400 bg-white/5 border border-white/10 py-2 rounded-lg cursor-not-allowed">
                        Session Ended
                      </button>
                    ) : (
                      <Link
                        to={`live/${live._id}`}
                        className={`inline-block text-center text-xs font-semibold text-white py-2 rounded-lg hover:opacity-95 transition-all duration-200 w-full ${
                          live.status === 'live'
                            ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:shadow-lg hover:shadow-red-900/20 animate-pulse'
                            : 'bg-gradient-to-r from-teal-600 to-blue-600 hover:shadow-lg hover:shadow-teal-900/20'
                        }`}
                      >
                        {live.status === 'live' ? 'Join Live Stream' : 'View Schedule Details'}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-semibold mb-3 text-white">Modules</h2>
          {Array.isArray(course.modules) && course.modules.length > 0 ? (
            <div className="space-y-3">
              {course.modules.map((mod) => {
                const isExpanded = expandedModules[mod._id];
                const topicsCount = Array.isArray(mod.topics) ? mod.topics.length : 0;
                
                return (
                  <div
                    key={mod._id}
                    className="bg-white/5 border border-white/10 backdrop-blur rounded-xl overflow-hidden"
                  >
                    <div
                      className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => toggleModule(mod._id)}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-base text-white">{mod.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{topicsCount} {topicsCount === 1 ? 'topic' : 'topics'}</p>
                      </div>
                      <button
                        className="ml-3 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        aria-label={isExpanded ? "Collapse module" : "Expand module"}
                      >
                        {isExpanded ? (
                          <ChevronUp size={18} className="text-gray-300" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-300" />
                        )}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-3 bg-black/20 border-t border-white/10">
                        {Array.isArray(mod.topics) && mod.topics.length > 0 ? (
                          <ol className="space-y-1 pt-2">
                            {mod.topics.map((topic) => (
                              <li key={topic._id} className="group relative rounded-lg">
                                <Link
                                  to={`topics/${topic._id}`}
                                  className="flex items-center justify-between py-2 px-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-colors cursor-pointer no-underline"
                                  aria-label={`Start ${topic.title}`}
                                  onMouseEnter={() => {
                                    import('./TopicView');
                                    import('./CourseContent');
                                  }}
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-sm text-white">{topic.title}</div>
                                    {Array.isArray(topic.articles) && topic.articles.length > 0 && (
                                      <div className="text-xs text-gray-400">Articles available</div>
                                    )}
                                  </div>

                                  <div className="ml-3 flex-shrink-0">
                                    <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-[#167468] group-hover:opacity-90 transition duration-150 ease-out">
                                      Start
                                    </span>
                                  </div>
                                </Link>
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="text-gray-400">No topics available for this module.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400">No modules available for this course yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
