import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Skeleton from './Skeleton';
import { ChevronRight, ChevronLeft, Award, Compass, ArrowLeft, ArrowRight, Search, SlidersHorizontal } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const RoadmapsPage = () => {
    const { theme } = useTheme();
    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState(null);
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [notesLoading, setNotesLoading] = useState(false);
    const [error, setError] = useState('');

    // Search and Pagination States
    const [searchQuery, setSearchQuery] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12; // 4 in a row, max 3 rows
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const fetchSections = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/api/public/sections?type=roadmap`);
            if (res.ok) {
                const data = await res.json();
                setSections(data || []);
            } else {
                setError('Failed to load roadmaps.');
            }
        } catch (err) {
            console.error('Error fetching roadmaps:', err);
            setError('Could not connect to the server.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSections();
    }, [fetchSections]);

    const handleSelectSection = async (section) => {
        setSelectedSection(section);
        setNotesLoading(true);
        setSelectedNote(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/public/sections/${section._id}/notes`);
            if (res.ok) {
                const data = await res.json();
                setNotes(data || []);
                if (data && data.length > 0) {
                    setSelectedNote(data[0]);
                }
            } else {
                console.error('Failed to load notes for section.');
            }
        } catch (err) {
            console.error('Error fetching notes:', err);
        } finally {
            setNotesLoading(false);
        }
    };

    const handleBackToList = () => {
        setSelectedSection(null);
        setNotes([]);
        setSelectedNote(null);
        setIsSidebarOpen(true);
    };

    // Filter sections based on search query and subject filter
    const filteredSections = sections.filter(section => {
        const matchesSearch = 
            section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (section.description && section.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
        // Subject matches can look inside titles or subjects
        const matchesSubject = !subjectFilter || 
            section.title.toLowerCase().includes(subjectFilter.toLowerCase()) ||
            (section.description && section.description.toLowerCase().includes(subjectFilter.toLowerCase()));

        return matchesSearch && matchesSubject;
    });

    // Paginate matching sections
    const totalPages = Math.ceil(filteredSections.length / itemsPerPage);
    const paginatedSections = filteredSections.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset pagination on search change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, subjectFilter]);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 pt-6 pb-12 min-h-[calc(100vh-7rem)] flex justify-center items-center">
                <div className="w-full max-w-6xl">
                    <Skeleton variant="grid" count={3} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 pt-6 pb-12 text-center text-red-500 min-h-[calc(100vh-7rem)] flex flex-col justify-center items-center">
                <p className="text-xl font-bold mb-4">{error}</p>
                <button onClick={fetchSections} className="px-6 py-2 rounded-xl bg-teal-600 text-white font-semibold shadow hover:opacity-90">Try Again</button>
            </div>
        );
    }

    return (
        <div className="bg-transparent min-h-screen text-gray-900 dark:text-white transition-colors duration-500">
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
                {!selectedSection ? (
                    <>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-center bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-500 dark:from-sky-400 dark:via-teal-300 dark:to-emerald-400 bg-clip-text text-transparent mb-6">
                            Interactive Developer Roadmaps
                            <span className="block w-24 h-2 bg-gradient-to-r from-sky-500 to-emerald-500 mx-auto mt-4 rounded-full"></span>
                        </h1>
                        <p className="text-center text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8 text-sm sm:text-base">
                            Step-by-step learning paths to help you master core engineering disciplines, track your progress, and secure high-paying roles.
                        </p>

                        {/* Advanced Search & Filter Panel */}
                        <div className="max-w-4xl mx-auto mb-10 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-md backdrop-blur flex flex-col sm:flex-row gap-4 items-center">
                            <div className="relative flex-1 w-full">
                                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Search roadmaps by title or topic..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-gray-800 dark:text-white"
                                />
                            </div>
                            <div className="relative w-full sm:w-64">
                                <SlidersHorizontal size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40" />
                                <select
                                    value={subjectFilter}
                                    onChange={(e) => setSubjectFilter(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-gray-800 dark:text-white appearance-none cursor-pointer"
                                >
                                    <option value="">All Subjects</option>
                                    <option value="frontend">Frontend</option>
                                    <option value="backend">Backend</option>
                                    <option value="fullstack">Fullstack</option>
                                    <option value="mobile">Mobile Dev</option>
                                    <option value="devops">DevOps & Cloud</option>
                                </select>
                            </div>
                        </div>

                        {/* Paginated 4-in-a-row Grid */}
                        {paginatedSections.length === 0 ? (
                            <div className="text-center py-16 text-gray-500 dark:text-gray-400 font-semibold bg-white dark:bg-white/5 rounded-2xl border border-gray-300 dark:border-white/10 max-w-lg mx-auto">
                                No roadmaps found matching your criteria.
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {paginatedSections.map(section => (
                                        <div
                                            key={section._id}
                                            onClick={() => handleSelectSection(section)}
                                            className="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 backdrop-blur shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                                        >
                                            <div className="relative h-36 overflow-hidden bg-gray-100 dark:bg-white/10">
                                                <img
                                                    src={section.imageUrl || 'https://placehold.co/600x400/cccccc/000000?text=Roadmap'}
                                                    alt={section.title}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                <div className="absolute bottom-3 left-3 right-3">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/80 text-white backdrop-blur-sm mb-1">
                                                        Developer Path
                                                    </span>
                                                    <h4 className="text-sm font-bold text-white leading-tight line-clamp-2">{section.title}</h4>
                                                </div>
                                            </div>
                                            <div className="p-4 flex-1 flex flex-col justify-between">
                                                <p className="text-gray-600 dark:text-gray-300 text-xs mb-3 line-clamp-3">
                                                    {section.description || 'No description available for this roadmap path.'}
                                                </p>
                                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-150 dark:border-white/5">
                                                    <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-300 group-hover:underline flex items-center gap-1">
                                                        Start Path <ChevronRight size={12} />
                                                    </span>
                                                    <Compass size={16} className="text-gray-400 dark:text-white/50 group-hover:rotate-45 transition-transform duration-300" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-4 mt-10">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-white/10 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/15 transition-all shadow-sm"
                                        >
                                            <ArrowLeft size={14} /> Previous
                                        </button>
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-white/10 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/15 transition-all shadow-sm"
                                        >
                                            Next <ArrowRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                ) : (
                    <div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-white/10">
                            <div className="flex flex-wrap items-center gap-4">
                                <button 
                                    onClick={handleBackToList}
                                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-white/10 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-white/15 transition-all shadow-sm shrink-0"
                                >
                                    <ArrowLeft size={14} /> Back to Roadmaps
                                </button>
                                <div className="h-6 w-[1px] bg-gray-300 dark:bg-white/10 hidden md:block"></div>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">{selectedSection.title}</h2>
                                    <p className="text-gray-500 dark:text-gray-405 mt-0.5 text-xs sm:text-sm">{selectedSection.description}</p>
                                </div>
                            </div>
                        </div>

                        {notesLoading ? (
                            <Skeleton variant="grid" count={2} />
                        ) : notes.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-semibold bg-white dark:bg-white/5 rounded-2xl border border-gray-300 dark:border-white/10">
                                This roadmap does not have any step notes assigned yet. Check back soon!
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                {/* Left Side Timeline Panel */}
                                <div className={`lg:col-span-3 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-md backdrop-blur lg:sticky lg:top-24 transition-all duration-300 ${isSidebarOpen ? 'block' : 'hidden'}`}>
                                    <h3 className="text-md font-bold text-gray-800 dark:text-white/80 border-b border-gray-200 dark:border-white/10 pb-3 mb-4 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Award size={18} className="text-teal-500" /> Learning Timeline
                                        </div>
                                        <button 
                                            onClick={() => setIsSidebarOpen(false)}
                                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
                                            title="Hide Learning Timeline"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                    </h3>
                                    
                                    <div className="relative pl-6 border-l-2 border-gray-200 dark:border-white/10 space-y-6">
                                        {notes.map((note, idx) => {
                                            const isActive = selectedNote && selectedNote._id === note._id;
                                            return (
                                                <div 
                                                    key={note._id}
                                                    onClick={() => setSelectedNote(note)}
                                                    className="relative cursor-pointer group"
                                                >
                                                    {/* Timeline Bullet */}
                                                    <span className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${isActive ? 'bg-teal-500 border-teal-500 scale-125 shadow-lg shadow-teal-500/40' : 'bg-white dark:bg-[#121212] border-gray-300 dark:border-white/20 group-hover:border-teal-400'}`}>
                                                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                                                    </span>

                                                    {/* Node Details */}
                                                    <div>
                                                        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-white/40 block">
                                                            Step {idx + 1}
                                                        </span>
                                                        <h4 className={`text-sm font-bold leading-snug transition-colors duration-200 ${isActive ? 'text-teal-600 dark:text-teal-300' : 'text-gray-700 dark:text-white/80 group-hover:text-teal-500'}`}>
                                                            {note.title}
                                                        </h4>
                                                        {note.subject && (
                                                            <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                                                                {note.subject}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Right Side Note Preview Panel */}
                                <div className={`bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-2xl p-6 shadow-md backdrop-blur min-h-[400px] transition-all duration-300 ${isSidebarOpen ? 'lg:col-span-9' : 'lg:col-span-12'}`}>
                                    {selectedNote ? (
                                        <article className="">
                                            <div className="flex flex-wrap items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4 mb-6 gap-2">
                                                <div className="flex items-center">
                                                    {!isSidebarOpen && (
                                                        <button 
                                                            onClick={() => setIsSidebarOpen(true)}
                                                            className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-250 dark:border-teal-805/50 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-all mr-3 shadow-sm shrink-0"
                                                            title="Show Learning Timeline"
                                                        >
                                                            <ChevronRight size={18} />
                                                        </button>
                                                    )}
                                                    <div>
                                                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white m-0 leading-tight">{selectedNote.title}</h3>
                                                        {selectedNote.subject && <span className="text-xs text-teal-600 dark:text-teal-300 font-bold uppercase tracking-wider block mt-1">{selectedNote.subject}</span>}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-400 dark:text-white/40">
                                                    Updated: {new Date(selectedNote.updatedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {selectedNote.imageUrl && (
                                                <img 
                                                    src={selectedNote.imageUrl} 
                                                    alt={selectedNote.title} 
                                                    className="w-full h-auto max-h-72 object-cover rounded-xl mb-6 shadow-sm border border-gray-200 dark:border-white/10" 
                                                />
                                            )}
                                            {/* rendered HTML content */}
                                            <div 
                                                className="note-html-content text-gray-700 dark:text-gray-200 leading-relaxed text-sm sm:text-base prose prose-slate dark:prose-invert max-w-none"
                                                dangerouslySetInnerHTML={{ __html: selectedNote.content }} 
                                            />
                                        </article>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400 font-medium">
                                            Select a timeline step to start reading.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default RoadmapsPage;
