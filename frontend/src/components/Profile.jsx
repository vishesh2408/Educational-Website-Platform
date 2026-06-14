import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Toast from './Toast';
import Spinner from './Spinner';
import { normalizeImageSrc } from '../utils/image';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

// --- Icons and Reusable Components (Kept as per original, assuming they work) ---
const BookOpenIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
const TrophyIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.98 1.05-.72.1-.82.16-.9.25-.8.8-1.99.79-2.85-.06a.7.7 0 0 0-.25-.26c-.46-.35-.74-.83-.82-1.4A5.5 5.5 0 0 1 4 17V8a5.5 5.5 0 0 1 5.5-5.5h5A5.5 5.5 0 0 1 20 8v9a5.5 5.5 0 0 1-2.92 4.88c-.09.07-.19.14-.3.21-.92.5-2.22.6-3.2.14a.8.8 0 0 0-.27-.18c-.46-.35-.74-.83-.82-1.4a5.5 5.5 0 0 1-.06-1.48V14.66Z" />
    <path d="M8 22h8" />
  </svg>
);
const CodeIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m18 6-6 6-6-6" />
    <path d="m6 18 6-6 6 6" />
  </svg>
);
const UserIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const UserPlusIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6" />
    <path d="M22 11h-6" />
  </svg>
);
const HeartIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.63 0-3.26.8-4.5 2.08C10.76 3.8 9.13 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);
const MessageCircleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="currentColor" {...props}>
    <path d="M200-200h200l200 200v-200h160q33 0 56.5-23.5T920-440v-280q0-33-23.5-56.5T840-800H120q-33 0-56.5 23.5T40-720v280q0 33 23.5 56.5T120-440h80v240Zm0-120H120v-280h720v280H440v160L200-320Z" />
  </svg>
);
const RunningWithErrorsIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor" {...props}>
    <path d="m200-120-40-80h-40l-20-40 40-40h200l20 40 40 40h40l-40 80h-200Zm20-300-40-80h-40l-20-40 40-40h200l20 40 40 40h40l-40 80H220Zm200-240-40-80h-40l-20-40 40-40h200l20 40 40 40h40l-40 80H420Z" />
  </svg>
);
const EditIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const XIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
// --- End of Icons ---

const PageSection = ({ title, children }) => (
  <section className="mb-4 sm:mb-6 lg:mb-8">
    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">{title}</h2>
    {children}
  </section>
);

const DashboardCard = ({ icon, title, value, color }) => (
  <div className={`flex items-center p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg ${color} text-white`}>
    <div className="text-2xl sm:text-3xl lg:text-4xl mr-3 sm:mr-4 shrink-0">{icon}</div>
    <div>
      <h3 className="text-sm sm:text-base lg:text-lg font-medium">{title}</h3>
      <p className="text-2xl sm:text-3xl font-bold mt-1">{value}</p>
    </div>
  </div>
);

const CourseCard = ({ course, type }) => (
  <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur p-5 rounded-2xl shadow-md transition-transform duration-200 ease-in-out transform hover:scale-105 shadow-sm dark:shadow-none">
    <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{course.title}</h4>
    {type === 'enrolled' && (
      <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2.5 mt-2">
        <div className="bg-gradient-to-r from-purple-500 to-[#167468] h-2.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
        <span className="text-sm text-gray-600 dark:text-gray-300 mt-1 block">{course.progress}% Complete</span>
      </div>
    )}
    {type === 'completed' && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Grade: <span className="font-medium text-emerald-600 dark:text-emerald-300">{course.grade}</span></p>}
    {type === 'saved' && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2"><HeartIcon className="inline mr-1" /> {course.savedBy} saves</p>}
  </div>
);


// --- Project Management Components (New/Modified) ---
const ProjectForm = ({ project = {}, isNew, onSubmit, onDelete, onCancel }) => {
    const [formData, setFormData] = useState({
        title: project.title || '',
        description: project.description || '',
        status: project.status || 'In Progress',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        await onSubmit(formData, project._id); // Pass project._id for updates
        setIsLoading(false);
    };

    return (
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-md mb-4 shadow-sm dark:shadow-none">
            <h4 className="font-semibold text-base sm:text-lg text-gray-905 dark:text-white mb-3">{isNew ? 'Add New Project' : `Edit Project: ${formData.title}`}</h4>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Title" required className="w-full p-2 rounded bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#167468]" />
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" required className="w-full p-2 rounded bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#167468]"></textarea>
              <select name="status" value={formData.status} onChange={handleChange} required className="w-full p-2 rounded bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#167468]">
                    <option value="In Progress" className="bg-white dark:bg-slate-950 text-gray-900 dark:text-white">In Progress</option>
                    <option value="Completed" className="bg-white dark:bg-slate-950 text-gray-900 dark:text-white">Completed</option>
                    <option value="Stuck" className="bg-white dark:bg-slate-950 text-gray-900 dark:text-white">Stuck</option>
                </select>
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-[#167468] text-white rounded hover:opacity-95 disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto">
                      {isLoading ? 'Saving...' : (isNew ? 'Add Project' : 'Update Project')}
                    </button>
                    {onCancel && (
                      <button type="button" onClick={onCancel} disabled={isLoading} className="px-3 py-2 bg-gray-150 border border-gray-200 text-gray-805 hover:bg-gray-200 dark:bg-white/10 dark:border-white/10 dark:text-white dark:hover:bg-white/15 text-sm sm:text-base w-full sm:w-auto">
                        Cancel
                      </button>
                    )}
                  </div>
                  {!isNew && (
                    <button type="button" onClick={() => onDelete(project._id)} disabled={isLoading} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto">
                      Delete
                    </button>
                  )}
                </div>
            </form>
        </div>
    );
};

// ProjectCard component with click-to-expand details
const ProjectCard = ({ project, editingProjectId, setEditingProjectId, handleProjectSubmit, handleDeleteProject }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const projectId = project._id || project.id;
    const isEditing = editingProjectId === projectId;

    // Toggle expansion unless clicking interactive elements like buttons
    const handleCardClick = (e) => {
        if (e.target.closest('button') || e.target.closest('form') || e.target.closest('input') || e.target.closest('select') || e.target.closest('textarea')) {
            return;
        }
        setIsExpanded(!isExpanded);
    };

    return (
        <div 
            onClick={handleCardClick}
            className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur p-6 rounded-2xl shadow-md flex flex-col justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-200 shadow-sm dark:shadow-none"
        >
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white break-words pr-2">{project.title}</h4>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingProjectId(isEditing ? null : projectId);
                        }}
                        className="text-xs text-teal-500 dark:text-teal-300 hover:underline focus:outline-none shrink-0"
                    >
                        {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                </div>
                
                {/* Expandable Description */}
                <p className={`text-sm text-gray-600 dark:text-gray-300 transition-all duration-300 break-words ${!isExpanded && !isEditing ? 'line-clamp-2' : ''}`}>
                    {project.description}
                </p>

                <div className="flex items-center justify-between mt-3 gap-2">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        project.status === 'Completed' 
                            ? 'bg-green-500/20 text-green-650 dark:text-green-300 border border-green-500/30' 
                            : project.status === 'Stuck' 
                                ? 'bg-red-500/20 text-red-650 dark:text-red-300 border border-red-500/30' 
                                : 'bg-yellow-500/20 text-yellow-650 dark:text-yellow-300 border border-yellow-500/30'
                    }`}>
                        {project.status}
                    </span>
                    {!isEditing && project.description && project.description.length > 80 && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium select-none whitespace-nowrap">
                            {isExpanded ? 'Click to collapse' : 'Click to expand'}
                        </span>
                    )}
                </div>
            </div>
            
            {isEditing && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
                    <ProjectForm 
                        project={project} 
                        isNew={false} 
                        onSubmit={handleProjectSubmit} 
                        onDelete={handleDeleteProject}
                        onCancel={() => setEditingProjectId(null)}
                    />
                </div>
            )}
        </div>
    );
};

// --- Main Profile Page Component ---
const Profile = () => {
  const { currentUser, logout, updateCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- State for all User Data (including new fields) ---
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    role: '',
    profilePicture: '', // Base64 string
    bio: '',
    technicalSkills: [],
    softSkills: [],
    skillsToLearn: [],
    projects: [], // Array of { _id, title, description, status }
    extraCurricular: [],
    other: '',
    activity: { lastActive: '', activeSessions: 0, totalMinutes: 0 },
    social: { followers: 0, following: 0, friends: [] },
    registeredContests: [],
  });

  const [quizAttempts, setQuizAttempts] = useState([]);

  

  const [editing, setEditing] = useState({
      username: false,
      bio: false,
      skills: false, // For all three skill arrays
      other: false,

      technicalSkills: false,
      softSkills: false,
      skillsToLearn: false,
      extraCurricular: false,
      other: false
});

  
  const [tempData, setTempData] = useState({}); // For holding unsaved changes
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);

  

  // --- Fetch Data from Backend ---
  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const res = await fetch(`${API_BASE_URL}/profile/me`, {
            credentials: 'include', // IMPORTANT: For cookie transport
        });

        if (!res.ok) {
    // Read the body as text to see the HTML error page content
    const errorBody = await res.text(); 
    console.error(`Server returned HTTP status ${res.status}. Content received:`, errorBody.substring(0, 200) + '...');
    
    // Check if the HTML is the body of the response for better debugging
    if (errorBody.startsWith('<!DOCTYPE')) {
         setError('Received HTML error page from server. Check server console for 404 or 500 error.');
    }
    
    // Still throw the error to stop the JSON parsing attempt
    throw new Error(`HTTP Error ${res.status}`);
}
        

        const data = await res.json();

        // Fetch quiz attempts
        let fetchedQuizAttempts = [];
        try {
            const quizRes = await fetch(`${API_BASE_URL}/user/quizzes/attempts`, {
                credentials: 'include',
            });
            if (quizRes.ok) {
                fetchedQuizAttempts = await quizRes.json();
            }
        } catch (quizErr) {
            console.error('Failed to fetch quiz attempts:', quizErr);
        }
        setQuizAttempts(fetchedQuizAttempts);

        // Initialize state with fetched data
        setProfileData({
            ...profileData,
            username: data.username,
            email: data.email,
            role: data.role,
            profilePicture: data.profilePicture || '',
            bio: data.bio || '',
            technicalSkills: data.technicalSkills || [],
            softSkills: data.softSkills || [],
            skillsToLearn: data.skillsToLearn || [],
            projects: data.projects || [],
            extraCurricular: data.extraCurricular || [],
            other: data.other || '',
            // Include existing activity/social data if available, or fall back to defaults
            activity: data.activity || profileData.activity || { lastActive: 'N/A', activeSessions: 0, totalMinutes: 0 }, 
            social: data.social || profileData.social || { followers: 0, following: 0, friends: [] },
            registeredContests: data.registeredContests || [],
        });
        




        // Initialize tempData with what's fetched
        setTempData({
            username: data.username,
            bio: data.bio || '',
            technicalSkills: '',
            softSkills: '',
            skillsToLearn: '',
            extraCurricular: '',
            other: data.other || '',
        });

    } catch (err) {
        console.error(err);
        setError(err.message);
    } finally {
        setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Toast helper using shared Toast component
  const showToast = (message, type = 'info', timeout = 3500) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), timeout);
  };



  
  const handleAddSkill = async (field, value) => {


  if (!value.trim()) return;

  const newValue = value.trim();

  // Update state instantly (optimistic UI)
  setProfileData(prev => ({
    ...prev,
    [field]: [...(prev[field] || []), newValue],
  }));
  setTempData(prev => ({ ...prev, [field]: '' }));

  try {
    await fetch(`${API_BASE_URL}/profile/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ [field]: [...profileData[field], newValue] }),
    });
  } catch (err) {
    console.error('Error saving skill:', err);
  }


};

const handleRemoveSkill = async (field, value) => {
  const updatedArray = profileData[field].filter(skill => skill !== value);
  setProfileData(prev => ({ ...prev, [field]: updatedArray }));
  try {
    await fetch(`${API_BASE_URL}/profile/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ [field]: updatedArray }),
    });
  } catch (err) {
    console.error('Error removing skill:', err);
  }
};




  // --- Handlers for Profile Picture ---
  const handlePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64String = reader.result; // This will be the full Data URL

        try {
            const res = await fetch(`${API_BASE_URL}/profile/picture`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({ profilePictureBase64: base64String }),
            });

            const result = await res.json();
            if (res.ok) {
            // Update state with the new base64 string returned from the server (or just re-fetch)
            setProfileData(prev => ({ ...prev, profilePicture: result.profilePicture }));
            if (typeof updateCurrentUser === 'function') {
                updateCurrentUser({ profilePicture: result.profilePicture });
            }
            showToast('Profile picture updated!', 'success');
            e.target.value = null; // Reset file input
          } else {
            showToast(`Error updating picture: ${result.msg || 'Server error'}`, 'error');
            e.target.value = null;
          }
        } catch (err) {
        console.error("Upload error:", err);
        showToast('Network error during picture upload.', 'error');
        e.target.value = null;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePicture = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/profile/picture`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (res.ok) {
          setProfileData(prev => ({ ...prev, profilePicture: '' }));
          if (typeof updateCurrentUser === 'function') {
              updateCurrentUser({ profilePicture: '' });
          }
          showToast('Profile picture removed. Using default.', 'info');
        } else {
          showToast('Could not remove profile picture.', 'error');
        }
    } catch (err) {
      console.error(err);
      showToast('Network error during picture removal.', 'error');
    }
  };

  // --- General Text/Array Field Handlers ---
  const handleEditToggle = (field) => {
      setEditing(prev => ({ ...prev, [field]: !prev[field] }));
      // If turning editing OFF, revert temp data to current state
      if (editing[field]) {
          setTempData(prev => ({ ...prev, [field]: profileData[field] }));
      }
  };

  const handleTempChange = (e) => {
      setTempData({ ...tempData, [e.target.name]: e.target.value });
  };
  
  // Skill Array Handlers (Reusable for technicalSkills, softSkills, skillsToLearn)
  const handleSkillArrayChange = (skillType, newArray) => {
      setTempData(prev => ({ ...prev, [skillType]: newArray }));
  };

  // Helper to convert comma-separated string to array for skills
  const skillsStringToArray = (str) => str.split(',').map(s => s.trim()).filter(s => s.length > 0);
 

  const skillsArrayToString = (skills) => {
  return Array.isArray(skills) ? skills.join(', ') : '';
};


const handleSkillStringChange = (e) => {
  const { name, value } = e.target;
  setTempData(prev => ({ ...prev, [name]: value.split(',').map(s => s.trim()).filter(Boolean) }));
};


//new 







  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
        const updatePayload = {
            username: editing.username ? tempData.username : undefined,
            bio: editing.bio ? tempData.bio : undefined,
            technicalSkills: editing.skills ? tempData.technicalSkills : undefined,
            softSkills: editing.skills ? tempData.softSkills : undefined,
            skillsToLearn: editing.skills ? tempData.skillsToLearn : undefined,
            extraCurricular: editing.skills ? tempData.extraCurricular : undefined,
            other: editing.other ? tempData.other : undefined,
        };
        
        // Filter out undefined values that aren't meant to be edited/updated
        const payloadToSend = Object.keys(updatePayload).reduce((acc, key) => {
            // Only send if the flag is true OR if the field is one that can be updated (like username/bio)
            if ((editing[key] || (key === 'username' && editing.username) || (key === 'bio' && editing.bio) || (key === 'other' && editing.other)) && updatePayload[key] !== undefined) {
                acc[key] = updatePayload[key];
            }
            return acc;
        }, {});


        if (Object.keys(payloadToSend).length === 0) {
          showToast('No changes were marked for saving.', 'info');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/profile/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify(payloadToSend),
        });

        const result = await res.json();
        if (res.ok) {
            showToast('Profile information updated successfully!', 'success');
            setProfileData(prev => ({ 
                ...prev, 
                username: result.user.username || prev.username, 
                bio: result.user.bio || prev.bio,
                technicalSkills: result.user.technicalSkills || prev.technicalSkills,
                softSkills: result.user.softSkills || prev.softSkills,
                skillsToLearn: result.user.skillsToLearn || prev.skillsToLearn,
                extraCurricular: result.user.extraCurricular || prev.extraCurricular,
                other: result.user.other || prev.other,
            }));
            if (typeof updateCurrentUser === 'function' && result.user.username) {
                updateCurrentUser({ username: result.user.username });
            }
            // Turn off all editing modes
            setEditing({ username: false, bio: false, skills: false, other: false });
        } else {
            showToast(`Error: ${result.msg || 'Could not update profile.'}`, 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Network error during profile update.', 'error');
    } finally {
        setLoading(false);
    }
  };







  
  // --- Project CRUD Handlers ---
  const handleProjectSubmit = async (projectData, projectId) => {
      setLoading(true);
      try {
          let res, result;
          if (!projectId) { // NEW Project
              res = await fetch(`${API_BASE_URL}/profile/projects`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify(projectData),
              });
          } else { // EDIT Project
               res = await fetch(`${API_BASE_URL}/profile/projects/${projectId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify(projectData),
              });
          }
          
          result = await res.json();

          if (res.ok) {
              if (!projectId) { // Add new to list
                setProfileData(prev => ({ ...prev, projects: [...prev.projects, result.project] }));
                // Hide the new project form after successful add
                setShowNewProjectForm(false);
              } else { // Update existing in list
                  setProfileData(prev => ({ 
                      ...prev, 
                      projects: prev.projects.map(p => p._id === projectId ? result.project : p) 
                  }));
                  setEditingProjectId(null);
              }
              showToast(projectId ? 'Project updated!' : 'Project added!', 'success');
          } else {
              showToast(`Error: ${result.msg || 'Failed to save project.'}`, 'error');
          }

      } catch (err) {
          console.error(err);
          showToast('Network error during project operation.', 'error');
      } finally {
          setLoading(false);
      }
  };
  
    // Request deletion: show non-blocking confirmation modal
    const handleDeleteProject = (projectId) => {
      setDeleteConfirmId(projectId);
    };

    const performConfirmedDelete = async (projectId) => {
      if (!projectId) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/profile/projects/${projectId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (res.ok) {
          setProfileData(prev => ({ ...prev, projects: prev.projects.filter(p => p._id !== projectId) }));
          showToast('Project deleted successfully!', 'success');
        } else {
          const result = await res.json().catch(() => ({}));
          showToast(`Error: ${result.msg || 'Failed to delete project.'}`, 'error');
        }

      } catch (err) {
        console.error(err);
        showToast('Network error during project deletion.', 'error');
      } finally {
        setLoading(false);
        setDeleteConfirmId(null);
        setEditingProjectId(null);
      }
    };

    const cancelDelete = () => setDeleteConfirmId(null);

  const handleSingleSectionSave = async (field) => {
  try {
    setLoading(true);
    const response = await fetch(`${API_BASE_URL}/profile/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // ✅ include cookies
      body: JSON.stringify({ [field]: tempData[field] })
    });

        if (!response.ok) throw new Error('Failed to update profile');
      const data = await response.json();
      setProfileData(data.user || {});
      setEditing(prev => ({ ...prev, [field]: false }));
  } catch (err) {
    console.error('Update error:', err);
    showToast('Error saving this section.', 'error');
  } finally {
    setLoading(false);
  }
};


  // Mock/Placeholder data for the remaining sections (as they weren't modified on the backend)
  const courses = { enrolled: [], completed: [], saved: [] };
  const certifications = [];
  const projects = profileData.projects; // Use the fetched projects now!
  const quizzes = {
      completed: quizAttempts.length,
      averageScore: quizAttempts.length > 0
          ? (quizAttempts.reduce((sum, attempt) => {
              const attemptScore = attempt.score !== undefined ? attempt.score : 0;
              const attemptTotal = attempt.totalQuestions !== undefined ? attempt.totalQuestions : 1;
              const pct = (attemptScore / attemptTotal) * 100;
              return sum + pct;
            }, 0) / quizAttempts.length).toFixed(1) + '%'
          : 'N/A',
      lastQuiz: ''
  };
  const contests = profileData.registeredContests || [];


  if (!currentUser) {
    // Avoid importing react-router-dom Navigate to prevent duplicate/casing resolution issues;
    // perform a client-side redirect instead.
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
      return null;
    }
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-gray-900 dark:text-white font-sans px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="max-w-7xl mx-auto animate-pulse">
          {/* Header Skeleton */}
          <header className="mb-6 sm:mb-8 lg:mb-10 text-center px-2">
            <div className="h-10 bg-gray-200 dark:bg-white/10 rounded-xl w-64 mx-auto mb-3" />
            <div className="h-4 bg-gray-100 dark:bg-white/5 rounded-lg w-48 mx-auto" />
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Main Profile Info and Dashboard (Left, span 2) */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
              {/* Profile Card Skeleton */}
              <div className="relative flex flex-col md:flex-row items-center md:items-start bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-lg shadow-sm dark:shadow-none">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gray-200 dark:bg-white/10 shrink-0 mb-4 md:mb-0 md:mr-6" />
                <div className="text-center md:text-left flex-grow w-full md:w-auto space-y-3">
                  <div className="flex flex-wrap items-center md:justify-start justify-center gap-2 mb-2">
                    <div className="h-7 bg-gray-200 dark:bg-white/10 rounded-lg w-40" />
                    <div className="h-5 bg-gray-100 dark:bg-white/5 rounded-full w-16" />
                  </div>
                  <div className="h-4 bg-gray-100 dark:bg-white/5 rounded-lg w-48 mx-auto md:mx-0" />
                  <div className="h-4 bg-gray-100 dark:bg-white/5 rounded-lg w-32 mx-auto md:mx-0" />
                  <div className="h-12 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl w-full mt-2" />
                </div>
              </div>

              {/* Skills Card Skeleton */}
              <div className="p-4 sm:p-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl sm:rounded-2xl space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-white/10 rounded-lg w-24 mb-4" />
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className="p-3 sm:p-4 border border-gray-200 dark:border-white/10 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-white/5 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-white/10 rounded-lg w-36 mb-2" />
                    <div className="flex flex-wrap gap-2">
                      <div className="h-6 bg-gray-200 dark:bg-white/10 rounded-full w-20" />
                      <div className="h-6 bg-gray-200 dark:bg-white/10 rounded-full w-16" />
                      <div className="h-6 bg-gray-200 dark:bg-white/10 rounded-full w-24" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Dashboard Grid Cards Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-5 rounded-2xl flex items-center justify-between shadow-sm dark:shadow-none">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-100 dark:bg-white/5 rounded-lg w-24" />
                      <div className="h-6 bg-gray-200 dark:bg-white/10 rounded-lg w-8" />
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-white/10" />
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Skeleton (Right, span 1) */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6 lg:space-y-8">
              {/* Activity Card Skeleton */}
              <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl space-y-4 shadow-sm dark:shadow-none">
                <div className="h-6 bg-gray-200 dark:bg-white/10 rounded-lg w-28 mb-3" />
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-white/10" />
                        <div className="h-4 bg-gray-100 dark:bg-white/5 rounded-lg w-32" />
                      </div>
                      <div className="h-4 bg-gray-200 dark:bg-white/10 rounded-lg w-8" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Community Stats Skeleton */}
              <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl space-y-4 shadow-sm dark:shadow-none">
                <div className="h-6 bg-gray-200 dark:bg-white/10 rounded-lg w-36 mb-3" />
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((idx) => (
                    <div key={idx} className="p-4 border border-gray-200 dark:border-white/10 rounded-xl flex flex-col items-center gap-2 bg-gray-50 dark:bg-white/5">
                      <div className="h-4 bg-gray-200 dark:bg-white/10 rounded-lg w-8" />
                      <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-lg w-12" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  if (error) {
    return <div className="flex justify-center items-center h-screen bg-transparent text-rose-600 dark:text-red-400 p-4 text-center">
      <div className="text-sm sm:text-base">Error: {error}. Please try logging in again.</div>
    </div>;
  }


const currentProfilePicUrl = profileData.profilePicture
  ? profileData.profilePicture.startsWith('data:')
      ? profileData.profilePicture
      : `data:image/png;base64,${profileData.profilePicture}`
  : 'https://placehold.co/150x150/cccccc/ffffff?text=Profile';


  // Helper for rendering skill inputs
  const renderSkillSection = (field, title, description) => (
      <div key={field} className="mt-4 p-3 sm:p-4 border border-gray-200 dark:border-white/10 rounded-lg sm:rounded-xl bg-gray-50/50 dark:bg-white/5">
        <div className="flex justify-between items-center mb-2 gap-2">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{title}</h4>
            <button onClick={() => setEditing(prev => ({ ...prev, [field]: !prev[field] }))} className="text-xs sm:text-sm text-teal-600 dark:text-teal-300 hover:underline whitespace-nowrap">
                {editing[field] ? 'Cancel' : 'Edit'}
            </button>
        </div>

        
        {editing[field] ? (
            <>
               
                <div className="flex flex-wrap gap-2 items-center">
  {profileData[field]?.map((item, i) => (
    <div
      key={i}
      className="flex items-center bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/80 text-sm font-medium px-2 py-1 rounded-full"
    >
      <span>{item}</span>
      <button
        onClick={() => handleRemoveSkill(field, item)}
        className="ml-2 text-gray-500 hover:text-red-650 dark:text-white/70 dark:hover:text-red-400 focus:outline-none"
        aria-label={`Remove ${item}`}
      >
        &times;
      </button>
    </div>
  ))}
</div>
    
    <input
      type="text"
          className="w-full p-2 rounded mt-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-450 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#167468]"
      value={tempData[field] || ''}
      onChange={e => setTempData(prev => ({ ...prev, [field]: e.target.value }))}
      placeholder={`Add ${title.toLowerCase().slice(0, -1)}`}
    />

        <button className='mt-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-[#167468] text-white rounded hover:opacity-95 disabled:opacity-50 text-xs sm:text-sm w-full sm:w-auto' onClick={() => handleAddSkill(field, tempData[field])}>
      {loading ? 'Saving...' : `Add ${title}`}
    </button>
                    <p className="text-xs mt-3 text-gray-500 dark:text-gray-400">{description}</p>
             

            </>
        ) : (
            <div className="flex flex-wrap gap-2">
                {profileData[field].length > 0 ? (
              profileData[field].map((skill, index) => (
                <span key={index} className="bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/80 text-sm font-medium px-3 py-1 rounded-full">{skill}</span>
              ))
            ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add Your Skills.</p>
                )}
            </div>
        )}
      </div>
  );

  return (
    <div className="min-h-screen bg-transparent text-gray-900 dark:text-white font-sans px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      {/* Toast container (shared) */}
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 sm:mb-8 lg:mb-10 text-center px-2">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-teal-600 via-emerald-500 to-indigo-600 dark:from-teal-400 dark:via-emerald-300 dark:to-indigo-400 bg-clip-text text-transparent">My Dashboard</h1>
          <p className="mt-2 text-sm sm:text-base lg:text-lg text-gray-605 dark:text-gray-300">Welcome back, {profileData.username}!</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Profile Info and Dashboard */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
            <PageSection title="My Profile">
              <div className="relative flex flex-col md:flex-row items-center md:items-start bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-lg shadow-sm dark:shadow-none">
                
                {/* Absolute Action Buttons (Edit / Save & Cancel) */}
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-10">
                  {(editing.username || editing.bio) ? (
                    <>
                      <button
                        onClick={handleProfileUpdate}
                        disabled={loading}
                        className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-[#167468] text-white hover:opacity-95 disabled:opacity-50 transition duration-200 flex items-center gap-1.5 cursor-pointer text-xs font-semibold shadow-sm focus:outline-none"
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditing(prev => ({ ...prev, username: false, bio: false }))}
                        className="px-3 py-2 rounded-xl border border-red-200 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:hover:bg-red-500/20 dark:text-red-300 transition duration-200 flex items-center gap-1.5 cursor-pointer text-xs font-semibold shadow-sm focus:outline-none"
                      >
                        <XIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Cancel</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditing(prev => ({ ...prev, username: true, bio: true }))}
                      className="px-3 py-2 rounded-xl border border-gray-200 hover:border-teal-400/50 hover:bg-gray-100 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 text-gray-750 dark:text-white transition duration-200 flex items-center gap-1.5 cursor-pointer text-xs font-semibold shadow-sm focus:outline-none"
                    >
                      <EditIcon className="w-4 h-4 text-teal-650 dark:text-teal-400" />
                      <span className="hidden sm:inline">Edit Profile</span>
                    </button>
                  )}
                </div>

                {/* PROFILE PICTURE SECTION */}
                <div className="flex flex-col items-center shrink-0 mb-4 md:mb-0 md:mr-6">
                  <div className="relative">
                    <img 
                      src={currentProfilePicUrl} 
                      alt="Profile" 
                      className="w-24 h-24 sm:w-28 sm:h-28 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full border-4 border-gray-150 dark:border-white/10 object-cover" 
                    />
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePictureChange} 
                        style={{ display: 'none' }} 
                        id="profile-pic-upload"
                    />
                    <button 
                        onClick={() => document.getElementById('profile-pic-upload').click()}
                        className="absolute bottom-0 right-0 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white p-1.5 rounded-full border-2 border-gray-200 dark:border-white/10 dark:hover:bg-white/15 transition-colors cursor-pointer"
                        title="Change Picture"
                    >
                        <UserPlusIcon className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                  {profileData.profilePicture && (
                     <button onClick={handleRemovePicture} className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-xs hover:underline mt-2 cursor-pointer transition">
                       Remove Picture
                     </button>
                  )}
                </div>

                {/* PROFILE INFO DISPLAY/EDIT */}
                <div className="text-center md:text-left flex-grow w-full md:w-auto pr-0 sm:pr-24">
                  <div className="flex flex-wrap items-center md:justify-start justify-center mb-2 gap-2">
                    {editing.username ? (
                        <input 
                          type="text" 
                          name="username" 
                          value={tempData.username} 
                          onChange={handleTempChange} 
                          className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white border border-gray-250 dark:border-white/10 p-1 sm:p-2 rounded bg-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#167468] w-full sm:w-auto"
                        />
                    ) : (
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{profileData.username}</h3>
                    )}
                    
                    <span className="inline-block bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-650 dark:text-white/80 text-xs font-semibold px-2.5 py-0.5 rounded-full">{profileData.role}</span>
                    {profileData.role === 'staff' && (
                      <span className="inline-flex items-center ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-650 dark:text-white/80">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.95a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 0 0-.364 1.118l1.286 3.95c.3.921-.755 1.688-1.54 1.118L10 13.347l-3.37 2.448c-.784.57-1.84-.197-1.54-1.118l1.286-3.95a1 1 0 0 0-.364-1.118L2.642 9.377c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.95z"/></svg>
                        Staff
                      </span>
                    )}
                  </div>

                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-2 break-all">{profileData.email}</p>

                  {/* BIO EDITING */}
                  <div className="mt-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-center md:justify-start mb-1 gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Bio:</span>
                        {!editing.bio ? (
                        <span className="text-sm text-gray-700 dark:text-gray-205 italic break-words">{profileData.bio || 'No bio set.'}</span>
                        ) : (
                            <textarea 
                                name="bio" 
                                value={tempData.bio} 
                                onChange={handleTempChange} 
                          className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#167468]"
                                rows="3"
                            />
                        )}
                    </div>
                  </div>
                  

                </div>
              </div>





              {/* SKILLS SECTION */}
              <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur rounded-xl sm:rounded-2xl shadow-lg shadow-sm dark:shadow-none">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">Skills</h3>
                {renderSkillSection('technicalSkills', 'Technical Skills', 'List all your technical proficiencies.')}
                {renderSkillSection('softSkills', 'Soft Skills', 'List all your soft skills.')}
                {renderSkillSection('skillsToLearn', 'Skills to Learn', 'List all skills you want to acquire.')}
                {renderSkillSection('extraCurricular', 'Extra Curricular Activities', 'List all activities.')}
                
                {/* OTHER FIELD */}
                <div className="mt-4 p-3 sm:p-4 border border-gray-200 dark:border-white/10 rounded-lg sm:rounded-xl bg-gray-50/50 dark:bg-white/5">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Other Information</h4>
                        <button onClick={() => setEditing(prev => ({ ...prev, other: !prev.other }))} className="text-sm text-teal-605 dark:text-teal-300 hover:underline">
                            {editing.other ? 'Cancel' : 'Edit'}
                        </button>
                    </div>
                    {editing.other ? (
                        <textarea
                            name="other"
                            value={tempData.other}
                            onChange={handleTempChange}
                            placeholder="Any other relevant information..."
                          className="w-full p-2 border border-gray-200 dark:border-white/10 rounded mb-2 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#167468]"
                            rows="3"
                        />
                    ) : (
                        <p className="flex items-center bg-gray-150/60 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/80 text-sm font-medium px-2 py-1 rounded-full">{profileData.other || 'No other information provided.'}</p>
                    )}
           
                {/* Save button for Skills/Other if any are being edited */}
                {( editing.other) && (
               <button
                        onClick={handleProfileUpdate}
                        disabled={loading}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-[#167468] text-white rounded hover:opacity-95 disabled:opacity-50 transition-colors text-sm sm:text-base w-full sm:w-auto"
                    >
                        {loading ? 'Saving...' : 'Save other Information'}
                    </button>
                )}
                </div>

  


              </div>


            </PageSection>

            {/* Dashboard Cards (Mocked Data) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  <DashboardCard icon={<BookOpenIcon />} title="Enrolled Courses" value={courses.enrolled.length} color="bg-teal-500" />
                  <DashboardCard icon={<TrophyIcon />} title="Certifications" value={certifications.length} color="bg-green-500" />
                  <DashboardCard icon={<CodeIcon />} title="Projects" value={profileData.projects.length} color="bg-blue-500" />
            </div>

            {/* Courses Section (Mocked Data) */}
            <PageSection title="My Courses">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Currently Pursuing</h3>
                  <div className="space-y-4">
                    {courses.enrolled.length > 0 ? (
                      courses.enrolled.map(course => <CourseCard key={course.id} course={course} type="enrolled" />)
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No enrolled courses.</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Completed</h3>
                  <div className="space-y-4">
                    {courses.completed.length > 0 ? (
                      courses.completed.map(course => <CourseCard key={course.id} course={course} type="completed" />)
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No completed courses.</p>
                    )}
                  </div>
                </div>
              </div>
            </PageSection>

            {/* PROJECTS SECTION (Using new CRUD logic) */}
            <PageSection title="My Projects">
              <div className="mb-4">
                {!showNewProjectForm ? (
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-[#167468] text-white rounded hover:opacity-95 text-sm sm:text-base w-full sm:w-auto"
                    onClick={() => setShowNewProjectForm(true)}
                  >
                    Add New Project
                  </button>
                ) : (
                  <div>
                    <ProjectForm isNew={true} onSubmit={handleProjectSubmit} onCancel={() => setShowNewProjectForm(false)} />
                    <div className="mt-2">
                      <button className="px-3 py-1 text-sm text-gray-500 dark:text-gray-300 hover:underline" onClick={() => setShowNewProjectForm(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.length > 0 ? (
                  projects.map(project => (
                    <ProjectCard
                      key={project._id || project.id}
                      project={project}
                      editingProjectId={editingProjectId}
                      setEditingProjectId={setEditingProjectId}
                      handleProjectSubmit={handleProjectSubmit}
                      handleDeleteProject={handleDeleteProject}
                    />
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No projects yet. Add one above!</p>
                )}
              </div>

              {/* Non-blocking delete confirmation modal */}
              {deleteConfirmId && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 px-4">
                  <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-3 text-gray-905 dark:text-white">Confirm Delete</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Are you sure you want to delete this project? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                      <button onClick={cancelDelete} className="px-4 py-2 bg-gray-100 border border-gray-205 text-gray-755 dark:bg-white/10 dark:border-white/10 dark:text-white rounded dark:hover:bg-white/15 hover:bg-gray-200">Cancel</button>
                      <button onClick={() => performConfirmedDelete(deleteConfirmId)} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
                    </div>
                  </div>
                </div>
              )}
            </PageSection>

            {/* Other Sections (Certifications - Mocked) */}
            <PageSection title="My Certifications">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {certifications.length > 0 ? (
                  certifications.map(cert => (
                    <div key={cert.id} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur p-6 rounded-2xl shadow-md shadow-sm dark:shadow-none">
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{cert.title}</h4>
                      <p className="text-sm text-gray-605 dark:text-gray-300 mt-2">Provider: {cert.provider}</p>
                      <p className="text-sm text-gray-605 dark:text-gray-300 mt-1">Date: {cert.date}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No certifications earned yet.</p>
                )}
              </div>
            </PageSection>

            {/* Saved Courses (Mocked Data) */}
            <PageSection title="Saved Courses">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.saved.length > 0 ? (
                  courses.saved.map(course => <CourseCard key={course.id} course={course} type="saved" />)
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No saved courses.</p>
                )}
              </div>
            </PageSection>
          </div>

          {/* Sidebar Section (Kept as is, Mocked Data) */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* User Activity (Mocked) */}
            <PageSection title="My Activity">
              <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg space-y-3 sm:space-y-4 shadow-sm dark:shadow-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BookOpenIcon className="text-xl text-teal-500 mr-3" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Quizzes Completed</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{quizzes.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <RunningWithErrorsIcon className="text-xl text-yellow-500 mr-3" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Contests Participated</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{contests.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrophyIcon className="text-xl text-green-500 mr-3" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Average Quiz Score</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{quizzes.averageScore}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <HeartIcon className="text-xl text-red-500 mr-3" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Last Active</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{profileData.activity?.lastActive || 'N/A'}</span>
                </div>

              </div>
            </PageSection>


            {/* Social & Community (Mocked) */}            <PageSection title="Community Stats">
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <button
                  onClick={() => navigate('/user/dashboard/community', { state: { activeTab: 'followers' } })}
                  className="group flex flex-col items-center justify-center p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-teal-400/40 dark:hover:border-teal-400/30 hover:bg-gray-50 dark:hover:bg-white/10 shadow-sm transition duration-300 hover:scale-105 active:scale-98 cursor-pointer focus:outline-none"
                >
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-300 transition duration-300 group-hover:scale-110">
                    {profileData.social?.followers || 0}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition duration-200">
                    Followers
                  </p>
                  <span className="text-[10px] text-teal-600/70 dark:text-teal-400/70 mt-1.5 opacity-80 group-hover:opacity-100 transition duration-200">
                    View list →
                  </span>
                </button>

                <button
                  onClick={() => navigate('/user/dashboard/community', { state: { activeTab: 'following' } })}
                  className="group flex flex-col items-center justify-center p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-teal-400/40 dark:hover:border-teal-400/30 hover:bg-gray-50 dark:hover:bg-white/10 shadow-sm transition duration-300 hover:scale-105 active:scale-98 cursor-pointer focus:outline-none"
                >
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-300 transition duration-300 group-hover:scale-110">
                    {profileData.social?.following || 0}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition duration-200">
                    Following
                  </p>
                  <span className="text-[10px] text-teal-600/70 dark:text-teal-400/70 mt-1.5 opacity-80 group-hover:opacity-100 transition duration-200">
                    View list →
                  </span>
                </button>

                <button
                  onClick={() => navigate('/user/dashboard/community', { state: { activeTab: 'friends' } })}
                  className="group flex flex-col items-center justify-center p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-teal-400/40 dark:hover:border-teal-400/30 hover:bg-gray-50 dark:hover:bg-white/10 shadow-sm transition duration-300 hover:scale-105 active:scale-98 cursor-pointer focus:outline-none"
                >
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-300 transition duration-300 group-hover:scale-110">
                    {profileData.social?.friends?.length || 0}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition duration-200">
                    Friends
                  </p>
                  <span className="text-[10px] text-teal-600/70 dark:text-teal-400/70 mt-1.5 opacity-80 group-hover:opacity-100 transition duration-200">
                    View list →
                  </span>
                </button>
              </div>
            </PageSection>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;