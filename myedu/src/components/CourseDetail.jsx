import React, { useEffect, useState } from 'react';
import Skeleton from './Skeleton';
import { useParams, Link } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
        if (mounted) setCourse(data);
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

  if (isLoading) return <div className="p-6"><Skeleton variant="card" count={2} /></div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!course) return <div className="p-6">Course not found.</div>;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link to="/user/dashboard" className="text-sm text-teal-600 dark:text-teal-300 underline">← Back to Home</Link>
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">{course.title}</h1>
        <p className="text-muted-foreground dark:text-slate-300">{course.description}</p>
        <div className="mt-4 text-sm">
          <span className="inline-block px-2 py-1 bg-muted dark:bg-gray-700 rounded-full mr-2 text-muted-foreground dark:text-slate-300">{course.type === 'paid' ? 'Premium' : 'Free'}</span>
          <span className="inline-block px-2 py-1 bg-muted dark:bg-gray-700 rounded-full text-muted-foreground dark:text-slate-300">{course.price}</span>
        </div>
      </header>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">Modules</h2>
        {Array.isArray(course.modules) && course.modules.length > 0 ? (
          <div className="space-y-6">
            {course.modules.map(mod => (
              <div key={mod._id} className="p-4 border border-border dark:border-color-border-dark rounded-lg bg-white dark:bg-color-card-bg-dark">
                <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-white">{mod.title}</h3>
                {Array.isArray(mod.topics) && mod.topics.length > 0 ? (
                  <ol className="space-y-2">
                    {mod.topics.map(topic => (
                      <li key={topic._id} className="group relative bg-transparent rounded-md">
                        <div className="flex items-center justify-between py-3 px-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md">
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 dark:text-white">{topic.title}</div>
                            {topic.notes && (
                              <div className="text-sm text-muted-foreground dark:text-slate-300">Notes available</div>
                            )}
                          </div>

                          {/* Start button: hidden by default, becomes visible when the row is hovered */}
                          <div className="ml-4 flex-shrink-0">
                                        <Link
                                          to={`topics/${topic._id}`}
                                          className="inline-block opacity-0 transform translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition duration-150 ease-out px-3 py-1 bg-teal-600 text-white rounded-md text-sm"
                                          aria-label={`Start ${topic.title}`}
                                          onMouseEnter={() => {
                                            // Prefetch heavy route components to improve perceived navigation speed
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
                  <p className="text-muted-foreground">No topics available for this module.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No modules available for this course yet.</p>
        )}
      </section>
    </main>
  );
}
