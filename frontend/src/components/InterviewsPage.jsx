import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Skeleton from './Skeleton';
import { ChevronRight, ArrowLeft, ArrowRight, MessageSquare, Terminal, Award, ChevronDown, ChevronUp, Search, SlidersHorizontal } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const QuestionAccordionItem = ({ note }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-gray-300 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-white/5 transition-all duration-300 shadow-sm hover:shadow-md">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <MessageSquare size={18} className="text-purple-500 shrink-0" />
                    <span>{note.title}</span>
                </div>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {isOpen && (
                <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-black/10">
                    {note.subject && (
                        <div className="mb-3">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                                {note.subject}
                            </span>
                        </div>
                    )}
                    {note.imageUrl && (
                        <img 
                            src={note.imageUrl} 
                            alt={note.title} 
                            className="w-full h-auto max-h-60 object-cover rounded-xl mb-4 shadow-sm border border-gray-200 dark:border-white/10" 
                        />
                    )}
                    <div 
                        className="note-html-content text-gray-700 dark:text-gray-200 leading-relaxed text-sm sm:text-base prose prose-slate dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: note.content }} 
                    />
                </div>
            )}
        </div>
    );
};

const InterviewsPage = () => {
    const { theme } = useTheme();
    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState(null);
    const [notes, setNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [notesLoading, setNotesLoading] = useState(false);
    const [error, setError] = useState('');

    // Search and Pagination States
    const [searchQuery, setSearchQuery] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12; // 4 in a row, max 3 rows

    const fetchSections = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/api/public/sections?type=interview`);
            if (res.ok) {
                const data = await res.json();
                setSections(data || []);
            } else {
                setError('Failed to load interview prep sets.');
            }
        } catch (err) {
            console.error('Error fetching interviews:', err);
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
        try {
            const res = await fetch(`${API_BASE_URL}/api/public/sections/${section._id}/notes`);
            if (res.ok) {
                const data = await res.json();
                setNotes(data || []);
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
    };

    // Filter sections based on search query and subject filter
    const filteredSections = sections.filter(section => {
        const matchesSearch = 
            section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (section.description && section.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
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
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-center bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 dark:from-purple-400 dark:via-pink-300 dark:to-indigo-400 bg-clip-text text-transparent mb-6">
                            Interview Preparation Q&As
                            <span className="block w-24 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 mx-auto mt-4 rounded-full"></span>
                        </h1>
                        <p className="text-center text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8 text-sm sm:text-base">
                            Curated interview questions and answers, coding challenges, system design solutions, and HR mock preps to help you ace your interviews.
                        </p>

                        {/* Advanced Search & Filter Panel */}
                        <div className="max-w-4xl mx-auto mb-10 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-md backdrop-blur flex flex-col sm:flex-row gap-4 items-center">
                            <div className="relative flex-1 w-full">
                                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Search interview sets by title or concept..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-800 dark:text-white"
                                />
                            </div>
                            <div className="relative w-full sm:w-64">
                                <SlidersHorizontal size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40" />
                                <select
                                    value={subjectFilter}
                                    onChange={(e) => setSubjectFilter(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-800 dark:text-white appearance-none cursor-pointer"
                                >
                                    <option value="">All Subjects</option>
                                    <option value="react">React</option>
                                    <option value="node">Node.js</option>
                                    <option value="system design">System Design</option>
                                    <option value="javascript">JavaScript</option>
                                    <option value="dsa">DSA</option>
                                </select>
                            </div>
                        </div>

                        {/* Paginated 4-in-a-row Grid */}
                        {paginatedSections.length === 0 ? (
                            <div className="text-center py-16 text-gray-500 dark:text-gray-400 font-semibold bg-white dark:bg-white/5 rounded-2xl border border-gray-300 dark:border-white/10 max-w-lg mx-auto">
                                No interview sets found matching your criteria.
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
                                                    src={section.imageUrl || 'https://placehold.co/600x400/cccccc/000000?text=Interview'}
                                                    alt={section.title}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                <div className="absolute bottom-3 left-3 right-3">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/80 text-white backdrop-blur-sm mb-1">
                                                        Technical QA
                                                    </span>
                                                    <h4 className="text-sm font-bold text-white leading-tight line-clamp-2">{section.title}</h4>
                                                </div>
                                            </div>
                                            <div className="p-4 flex-1 flex flex-col justify-between">
                                                <p className="text-gray-600 dark:text-gray-300 text-xs mb-3 line-clamp-3">
                                                    {section.description || 'No description available for this interview preparation guide.'}
                                                </p>
                                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-150 dark:border-white/5">
                                                    <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-300 group-hover:underline flex items-center gap-1">
                                                        Explore Q&A <ChevronRight size={12} />
                                                    </span>
                                                    <Terminal size={16} className="text-gray-400 dark:text-white/50 group-hover:translate-x-1 transition-transform duration-300" />
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
                        <button 
                            onClick={handleBackToList}
                            className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-xl text-sm font-bold bg-white dark:bg-white/10 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-white/15 transition-all shadow-sm"
                        >
                            <ArrowLeft size={16} /> Back to Interview Prep
                        </button>

                        <div className="mb-6">
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">{selectedSection.title}</h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">{selectedSection.description}</p>
                        </div>

                        {notesLoading ? (
                            <Skeleton variant="list" count={4} />
                        ) : notes.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-semibold bg-white dark:bg-white/5 rounded-2xl border border-gray-300 dark:border-white/10">
                                This prep set does not have any questions or answers assigned yet. Check back soon!
                            </div>
                        ) : (
                            <div className="space-y-4 max-w-4xl mx-auto">
                                <h3 className="text-md font-bold text-gray-800 dark:text-white/80 border-b border-gray-200 dark:border-white/10 pb-3 mb-4 flex items-center gap-2">
                                    <Award size={18} className="text-purple-500" /> Q&A Index ({notes.length} items)
                                </h3>
                                {notes.map(note => (
                                    <QuestionAccordionItem key={note._id} note={note} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default InterviewsPage;
