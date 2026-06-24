import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, Shield, Calendar, Clock, AlertTriangle, ShieldAlert, User, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Skeleton from './Skeleton';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

export default function LiveClassViewer() {
    const { id: courseId, liveClassId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [liveClass, setLiveClass] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isTabActive, setIsTabActive] = useState(true);
    
    // Dynamic Watermark Position
    const [watermarkPos, setWatermarkPos] = useState({ top: '20%', left: '20%' });

    // Fetch Live Class details
    useEffect(() => {
        let mounted = true;
        const fetchLiveClassDetails = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_BASE_URL}/live-classes/${liveClassId}`, {
                    credentials: 'include'
                });
                if (!res.ok) {
                    const txt = await res.text();
                    throw new Error(txt || `Failed to fetch live class: ${res.status}`);
                }
                const data = await res.json();
                if (mounted) setLiveClass(data);
            } catch (err) {
                console.error('Live class viewer error:', err);
                if (mounted) setError(err.message || 'Failed to load live class stream');
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        fetchLiveClassDetails();
        return () => { mounted = false; };
    }, [liveClassId]);

    // Security Feature 1: Disable Context Menu (Right Click)
    useEffect(() => {
        const handleContextMenu = (e) => e.preventDefault();
        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, []);

    // Security Feature 2: Disable DevTools Shortcuts (F12, Inspect keys, Source codes)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
                (e.ctrlKey && e.key === 'u')
            ) {
                e.preventDefault();
                alert("Security Warning: Developer actions are strictly monitored and disabled on this secure video page.");
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Security Feature 3: Pause Video Player when Tab is Hidden (Visibility API)
    useEffect(() => {
        const handleVisibility = () => {
            setIsTabActive(!document.hidden);
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);

    // Security Feature 4: Periodically drift the watermark overlay to prevent crop-out screen recording
    useEffect(() => {
        const interval = setInterval(() => {
            const randomTop = Math.floor(Math.random() * 70) + 15; // 15% to 85%
            const randomLeft = Math.floor(Math.random() * 50) + 15; // 15% to 65%
            setWatermarkPos({ top: `${randomTop}%`, left: `${randomLeft}%` });
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    const getYoutubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-slate-950 text-white p-6 flex items-center justify-center">
                <div className="max-w-4xl w-full">
                    <Skeleton variant="card" count={1} />
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-slate-950 text-white p-6 flex items-center justify-center">
                <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                    <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-red-200 mb-2">Access Restrained</h2>
                    <p className="text-sm text-red-300/80 mb-6">{error}</p>
                    <button onClick={() => navigate(-1)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition">
                        Back to Course
                    </button>
                </div>
            </main>
        );
    }

    const ytId = liveClass ? getYoutubeId(liveClass.streamURL) : null;
    const watermarkText = `SECURED STREAM • USER: ${currentUser?.username || 'STUDENT'} (${currentUser?.email || 'N/A'}) • TIMESTAMP: ${new Date().toLocaleDateString()}`;

    return (
        <div className="min-h-screen bg-slate-950 text-white py-6 select-none" style={{ userSelect: 'none' }}>
            <main className="max-w-5xl mx-auto px-6">
                
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4 group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    Back to Course Details
                </button>

                {/* Secure Stream Frame Container */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
                    
                    {/* Security Watermark (Drifts across player) */}
                    <div 
                        className="absolute pointer-events-none z-50 text-[10px] md:text-xs font-bold text-white/15 dark:text-white/10 select-none whitespace-nowrap bg-black/10 px-2.5 py-1 rounded border border-white/5"
                        style={{ 
                            top: watermarkPos.top, 
                            left: watermarkPos.left, 
                            transition: 'all 1.5s ease-in-out',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                        }}
                    >
                        {watermarkText}
                    </div>

                    {/* Left/Right Static Corner Watermarks */}
                    <div className="absolute top-4 left-4 pointer-events-none z-40 text-[9px] text-white/5 font-semibold select-none">
                        MYEDU SECURE PLAYER
                    </div>
                    <div className="absolute bottom-4 right-4 pointer-events-none z-40 text-[9px] text-white/5 font-semibold select-none">
                        IP VERIFIED • COPY PROTECTED
                    </div>

                    {/* Active tab check (Pauses/covers stream when user unfocusses tab) */}
                    {!isTabActive ? (
                        <div className="absolute inset-0 z-40 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                            <Shield size={48} className="text-teal-400 mb-4 animate-pulse" />
                            <h3 className="text-lg font-bold text-white mb-2">Stream Cover Triggered</h3>
                            <p className="text-sm text-gray-400 max-w-sm">
                                The secure session has been blurred because the active browser tab or window lost focus. Return to this tab to resume.
                            </p>
                        </div>
                    ) : null}

                    {/* Video Player Render */}
                    {liveClass.status === 'upcoming' ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-900 text-center">
                            <Calendar size={64} className="text-teal-400 mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Upcoming Live Session</h3>
                            <p className="text-sm text-gray-400 max-w-sm mb-4">
                                This live stream is scheduled to start at: <br/>
                                <span className="font-semibold text-teal-300">{new Date(liveClass.scheduledAt).toLocaleString()}</span>
                            </p>
                            <span className="px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 font-semibold uppercase tracking-wider">
                                Scheduled ({liveClass.duration})
                            </span>
                        </div>
                    ) : ytId ? (
                        <iframe
                            className="absolute inset-0 w-full h-full"
                            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&modestbranding=1&rel=0`}
                            title={liveClass.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    ) : (
                        <iframe
                            className="absolute inset-0 w-full h-full"
                            src={liveClass.streamURL}
                            title={liveClass.title}
                            frameBorder="0"
                            allowFullScreen
                        ></iframe>
                    )}
                </div>

                {/* Session details */}
                {liveClass && (
                    <div className="mt-6 bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-6 shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                                    <Video size={24} className="text-purple-400" />
                                    {liveClass.title}
                                </h1>
                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                                    <Shield size={14} className="text-teal-500" /> Secured Streaming Channel (No Copy policy active)
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                    liveClass.status === 'live' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}>
                                    {liveClass.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>}
                                    {liveClass.status.toUpperCase()}
                                </span>
                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-gray-300">
                                    {liveClass.duration}
                                </span>
                            </div>
                        </div>
                        <div className="border-t border-white/10 pt-4">
                            <h3 className="text-sm font-semibold text-gray-300 mb-2">Session Overview</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">{liveClass.description || 'No description provided for this session.'}</p>
                        </div>
                    </div>
                )}

                {/* Security instructions */}
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
                    <AlertTriangle size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-bold text-yellow-300 uppercase tracking-wider">Confidentiality Policy</h4>
                        <p className="text-xs text-yellow-200/80 mt-1 leading-relaxed">
                            This streaming stream is encrypted and watermarked with your account details. Any screen capturing, broadcasting, or redistribution of this content is a violation of the Terms of Service and will result in permanent account termination and legal action.
                        </p>
                    </div>
                </div>

            </main>
        </div>
    );
}
