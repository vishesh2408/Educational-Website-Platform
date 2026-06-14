import React, { useEffect, useState, Suspense } from 'react';
import Skeleton from './Skeleton';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft, 
  BookOpen, 
  Video, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Play, 
  FileText,
  Award,
  Sparkles,
  Trophy,
  Menu
} from 'lucide-react';

const CourseContent = React.lazy(() => import('./CourseContent'));
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

// Helper function to extract YouTube ID
const getYoutubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function TutorialDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tutorial, setTutorial] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [steps, setSteps] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('article'); // 'article', 'video', 'quiz'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const fetchTutorial = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/public/tutorials/${id}`);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Failed to fetch tutorial: ${res.status}`);
        }
        const data = await res.json();
        if (mounted) {
          setTutorial(data);
          
          // Build sequential steps list
          const flatSteps = [];
          const initialExpanded = {};
          
          if (data.modules && Array.isArray(data.modules)) {
            // Sort modules by order if present
            const sortedModules = [...data.modules].sort((a, b) => (a.order || 0) - (b.order || 0));
            
            sortedModules.forEach(mod => {
              // Expand all modules by default for clean navigation
              initialExpanded[mod._id] = true;
              
              if (mod.topics && Array.isArray(mod.topics)) {
                // Sort topics by order if present
                const sortedTopics = [...mod.topics].sort((a, b) => (a.order || 0) - (b.order || 0));
                
                sortedTopics.forEach(topic => {
                  if (topic.articles && Array.isArray(topic.articles) && topic.articles.length > 0) {
                    const sortedArticles = [...topic.articles].sort((a, b) => (a.order || 0) - (b.order || 0));
                    sortedArticles.forEach((article, aIdx) => {
                      flatSteps.push({
                        type: 'article',
                        module: mod,
                        topic: topic,
                        article: article,
                        articleIndex: aIdx,
                        stepId: `${topic._id}_art_${aIdx}`
                      });
                    });
                  } else {
                    flatSteps.push({
                      type: 'empty-topic',
                      module: mod,
                      topic: topic,
                      article: null,
                      articleIndex: -1,
                      stepId: `${topic._id}_empty`
                    });
                  }
                });
              }
            });
          }
          
          setSteps(flatSteps);
          setExpandedModules(initialExpanded);
          setCurrentStepIdx(0);
          setIsCompleted(false);
        }
      } catch (err) {
        console.error('Tutorial detail fetch error:', err);
        if (mounted) setError(err.message || 'Failed to load tutorial');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchTutorial();
    return () => { mounted = false; };
  }, [id]);

  // Reset tab to article whenever step index changes
  useEffect(() => {
    setActiveTab('article');
  }, [currentStepIdx]);

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
      
      // Auto expand next module if it's collapsed
      const nextStep = steps[currentStepIdx + 1];
      if (nextStep && nextStep.module) {
        setExpandedModules(prev => ({
          ...prev,
          [nextStep.module._id]: true
        }));
      }
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
      
      // Auto expand prev module if collapsed
      const prevStep = steps[currentStepIdx - 1];
      if (prevStep && prevStep.module) {
        setExpandedModules(prev => ({
          ...prev,
          [prevStep.module._id]: true
        }));
      }
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white flex items-center justify-center">
        <div className="w-full max-w-4xl px-4 py-8">
          <Skeleton variant="card" count={2} />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center space-y-4">
          <h2 className="text-xl font-bold text-red-400">Error Loading Tutorial</h2>
          <p className="text-sm text-red-200">{error}</p>
          <Link
            to="/user/dashboard"
            className="inline-block px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (!tutorial) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-300">Tutorial not found.</p>
          <Link
            to="/user/dashboard"
            className="inline-block px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-lg text-sm transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (steps.length === 0) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-6 py-12 bg-white/5 border border-white/10 rounded-2xl">
          <FileText size={48} className="mx-auto text-gray-500" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">No Content Yet</h2>
            <p className="text-sm text-gray-400">This tutorial is currently empty. The instructor has not uploaded any topics or articles yet.</p>
          </div>
          <Link
            to="/user/dashboard"
            className="inline-block px-6 py-2.5 bg-gradient-to-r from-purple-500 to-[#167468] text-white rounded-xl text-sm font-bold shadow-lg"
          >
            Go Back
          </Link>
        </div>
      </main>
    );
  }

  if (isCompleted) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center space-y-8 bg-white/5 border border-white/10 backdrop-blur-md p-10 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-teal-500 flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <Trophy size={48} className="text-white" />
            </div>
            <div className="absolute top-0 right-[25%] text-purple-400 animate-pulse"><Sparkles size={24} /></div>
            <div className="absolute bottom-0 left-[25%] text-teal-400 animate-pulse"><Sparkles size={20} /></div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-teal-400">
              Congratulations!
            </h1>
            <p className="text-xl font-semibold text-white">
              You completed the "{tutorial.title}" Tutorial
            </p>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              You've successfully finished all reading modules, topics, and lessons. Keep up the momentum and explore our other computer science courses or take interactive quizzes!
            </p>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/user/dashboard/courses"
              className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-[#167468] text-white hover:opacity-95 transition text-sm shadow-lg shadow-purple-500/10"
            >
              Explore Courses
            </Link>
            <Link
              to="/user/dashboard/quizzes"
              className="px-6 py-3 rounded-xl font-bold bg-white/10 border border-white/10 text-white hover:bg-white/15 transition text-sm"
            >
              Practice Quizzes
            </Link>
            <button
              onClick={() => {
                setIsCompleted(false);
                setCurrentStepIdx(0);
              }}
              className="px-6 py-3 rounded-xl font-bold bg-transparent border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition text-sm"
            >
              Review Tutorial
            </button>
          </div>
        </div>
      </main>
    );
  }

  const activeStep = steps[currentStepIdx];
  const progressPercent = Math.round(((currentStepIdx + 1) / steps.length) * 100);

  const isTopicActive = (topicId) => {
    return activeStep && activeStep.topic._id === topicId;
  };

  const isArticleActive = (topicId, articleIdx) => {
    return activeStep && activeStep.topic._id === topicId && activeStep.articleIndex === articleIdx;
  };

  // Video and Quiz availability checks
  const hasVideo = activeStep.type === 'article' && activeStep.article.videoURL;
  const hasQuiz = activeStep.type === 'article' && activeStep.article.quizId;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white flex flex-col md:flex-row relative">
      
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/80 backdrop-blur sticky top-16 z-30">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg transition"
        >
          <Menu size={16} />
          <span>Outline</span>
        </button>
        <span className="text-xs text-gray-400 font-medium">
          {currentStepIdx + 1} / {steps.length} Steps ({progressPercent}%)
        </span>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 top-16 bg-black/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* Left Sidebar */}
      <aside className={`
        fixed md:sticky top-16 bottom-0 left-0 z-40 md:z-auto
        w-72 md:w-80 bg-slate-900 md:bg-slate-900/40 border-r border-white/10
        h-[calc(100vh-4rem)] overflow-y-auto flex flex-col shrink-0
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Tutorial Title & Info */}
        <div className="p-4 border-b border-white/10">
          <Link 
            to="/user/dashboard" 
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-3 transition"
          >
            <ArrowLeft size={12} />
            <span>All Tutorials</span>
          </Link>
          <h2 className="text-lg font-bold text-white leading-tight mb-2 truncate" title={tutorial.title}>
            {tutorial.title}
          </h2>
          
          {/* Progress Bar */}
          <div className="space-y-1.5 mt-2">
            <div className="flex justify-between text-[10px] font-bold text-gray-400">
              <span>PROGRESS</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Modules & Topics Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {tutorial.modules.map((mod) => {
            const isExpanded = expandedModules[mod._id];
            const topics = mod.topics || [];
            
            return (
              <div 
                key={mod._id}
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
              >
                {/* Module Header */}
                <div 
                  className="px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition"
                  onClick={() => toggleModule(mod._id)}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-bold text-xs text-gray-200 truncate" title={mod.title}>{mod.title}</h3>
                  </div>
                  <span className="text-gray-400 shrink-0">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </div>

                {/* Module Topics List */}
                {isExpanded && (
                  <div className="p-2 bg-black/10 border-t border-white/10 space-y-2">
                    {topics.length > 0 ? (
                      topics.map((topic) => {
                        const isActive = isTopicActive(topic._id);
                        const hasMultipleArticles = Array.isArray(topic.articles) && topic.articles.length > 1;

                        return (
                          <div key={topic._id} className="space-y-1">
                            {hasMultipleArticles ? (
                              <div className="space-y-1.5">
                                <div className="text-[10px] font-bold px-2 py-0.5 text-gray-400 uppercase tracking-wider">
                                  {topic.title}
                                </div>
                                <div className="pl-2.5 border-l border-white/5 ml-2.5 space-y-1">
                                  {topic.articles.map((art, aIdx) => {
                                    const active = isArticleActive(topic._id, aIdx);
                                    const stepIdx = steps.findIndex(s => s.topic._id === topic._id && s.articleIndex === aIdx);
                                    return (
                                      <button
                                        key={art._id || aIdx}
                                        onClick={() => {
                                          if (stepIdx !== -1) {
                                            setCurrentStepIdx(stepIdx);
                                            setIsSidebarOpen(false);
                                          }
                                        }}
                                        className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                                          active 
                                            ? 'bg-gradient-to-r from-purple-500/20 to-[#167468]/20 border border-purple-500/30 text-purple-200 font-semibold shadow-inner' 
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                      >
                                        <BookOpen size={11} className="shrink-0" />
                                        <span className="truncate">{art.heading || `Article ${aIdx + 1}`}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  const stepIdx = steps.findIndex(s => s.topic._id === topic._id);
                                  if (stepIdx !== -1) {
                                    setCurrentStepIdx(stepIdx);
                                    setIsSidebarOpen(false);
                                  }
                                }}
                                className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                                  isActive 
                                    ? 'bg-gradient-to-r from-purple-500/20 to-[#167468]/20 border border-purple-500/30 text-purple-200 font-semibold shadow-inner' 
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <BookOpen size={12} className="shrink-0" />
                                <span className="truncate">{topic.title}</span>
                              </button>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[10px] text-gray-500 italic px-2">No topics in this module</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Right Content Area */}
      <main className="flex-grow flex flex-col min-w-0">
        
        {/* Content Wrapper */}
        <div className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
          
          {/* Breadcrumbs & Step Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-4">
            <div className="text-xs text-gray-400 flex items-center gap-1.5 flex-wrap">
              <span>{activeStep.module.title}</span>
              <ChevronRight size={10} />
              <span className="text-gray-300 font-medium">{activeStep.topic.title}</span>
            </div>
            <div className="shrink-0 text-xs font-semibold text-teal-400">
              STEP {currentStepIdx + 1} OF {steps.length}
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {activeStep.type === 'article' ? (activeStep.article.heading || activeStep.topic.title) : activeStep.topic.title}
          </h1>

          {/* Inline Tab Navigation Bar (Article, Video, Quiz) */}
          {(hasVideo || hasQuiz) && (
            <div className="flex border-b border-white/5 gap-2 pb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab('article')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition ${
                  activeTab === 'article'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <BookOpen size={14} />
                <span>Article Note</span>
              </button>
              
              {hasVideo && (
                <button
                  onClick={() => setActiveTab('video')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition ${
                    activeTab === 'video'
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Video size={14} />
                  <span>Video Lesson</span>
                </button>
              )}
              
              {hasQuiz && (
                <button
                  onClick={() => setActiveTab('quiz')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition ${
                    activeTab === 'quiz'
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Award size={14} />
                  <span>Practice Quiz</span>
                </button>
              )}
            </div>
          )}

          {/* Body Content */}
          <div className="min-h-[300px]">
            {activeTab === 'article' && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-8 backdrop-blur shadow-xl">
                {activeStep.type === 'article' ? (
                  <Suspense
                    fallback={
                      <div className="flex flex-col items-center justify-center p-12 text-gray-300 space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-b-purple-400"></div>
                        <span className="text-sm">Loading note content...</span>
                      </div>
                    }
                  >
                    <CourseContent html={activeStep.article.content || ''} />
                  </Suspense>
                ) : (
                  <div className="p-12 text-center space-y-4">
                    <FileText size={40} className="mx-auto text-gray-500" />
                    <p className="text-sm text-gray-400">No detailed notes available for this topic.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'video' && hasVideo && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-8 backdrop-blur shadow-xl">
                {getYoutubeId(activeStep.article.videoURL) ? (
                  <div className="space-y-4">
                    <div className="relative pb-[56.25%] h-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black">
                      <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${getYoutubeId(activeStep.article.videoURL)}`}
                        title="Video Lesson"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <p className="text-xs text-gray-400 text-center italic">YouTube lesson embedded above. Click play to watch.</p>
                  </div>
                ) : (
                  <div className="p-8 text-center max-w-lg mx-auto space-y-4">
                    <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
                      <Play size={24} />
                    </div>
                    <h3 className="text-base font-bold text-white">Watch External Video</h3>
                    <p className="text-xs text-gray-400">This lesson contains a video tutorial hosted externally. Click the link below to watch it in a new window.</p>
                    <a
                      href={activeStep.article.videoURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-[#167468] text-white hover:opacity-90 transition shadow-lg"
                    >
                      <span>Open Video Lesson</span>
                      <ChevronRight size={14} />
                    </a>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'quiz' && hasQuiz && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-8 backdrop-blur shadow-xl">
                <div className="p-8 text-center max-w-lg mx-auto space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                    <Award size={24} />
                  </div>
                  <h3 className="text-base font-bold text-white">Practice Quiz</h3>
                  <p className="text-xs text-gray-400">Test your comprehension of this topic by completing the practice quiz. Your score will be saved.</p>
                  <Link
                    to={`/user/dashboard/quizzes/${activeStep.article.quizId}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 transition shadow-lg"
                  >
                    <span>Start Practice Quiz</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sequential Navigation Bar */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-between gap-4">
            <button
              onClick={handlePrev}
              disabled={currentStepIdx === 0}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                currentStepIdx === 0
                  ? 'bg-white/5 border border-white/5 text-gray-500 cursor-not-allowed'
                  : 'bg-white/10 border border-white/10 text-white hover:bg-white/15'
              }`}
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
            
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-[#167468] text-white hover:opacity-95 transition shadow-lg shadow-purple-500/10 active:scale-95"
            >
              <span>{currentStepIdx === steps.length - 1 ? 'Finish Tutorial' : 'Next Lesson'}</span>
              <ChevronRight size={16} />
            </button>
          </div>

        </div>

      </main>
    </div>
  );
}
