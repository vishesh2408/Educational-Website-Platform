import React, { useEffect, useState } from 'react';
import Skeleton from './Skeleton';
import { useParams, Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
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
                                <div className="flex items-center justify-between py-2 px-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-colors">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm text-white">{topic.title}</div>
                                    {Array.isArray(topic.articles) && topic.articles.length > 0 && (
                                      <div className="text-xs text-gray-400">Articles available</div>
                                    )}
                                  </div>

                                  <div className="ml-3 flex-shrink-0">
                                    <Link
                                      to={`topics/${topic._id}`}
                                      className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-[#167468] hover:opacity-90 transition duration-150 ease-out"
                                      aria-label={`Start ${topic.title}`}
                                      onMouseEnter={() => {
                                        import('./TopicView');
                                        import('./CourseContent');
                                      }}
                                    >
                                      Start
                                    </Link>
                                  </div>
                                </div>
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
