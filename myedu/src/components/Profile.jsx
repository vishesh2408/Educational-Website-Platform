import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Toast from './Toast';
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
// --- End of Icons ---

const PageSection = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
    {children}
  </section>
);

const DashboardCard = ({ icon, title, value, color }) => (
  <div className={`flex items-center p-6 rounded-2xl shadow-lg ${color} text-white`}>
    <div className="text-4xl mr-4">{icon}</div>
    <div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  </div>
);

const CourseCard = ({ course, type }) => (
  <div className="bg-white/5 border border-white/10 backdrop-blur p-5 rounded-2xl shadow-md transition-transform duration-200 ease-in-out transform hover:scale-105">
    <h4 className="font-semibold text-lg text-white mb-2">{course.title}</h4>
    {type === 'enrolled' && (
      <div className="w-full bg-white/10 rounded-full h-2.5 mt-2">
        <div className="bg-gradient-to-r from-purple-500 to-[#167468] h-2.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
        <span className="text-sm text-gray-300 mt-1 block">{course.progress}% Complete</span>
      </div>
    )}
    {type === 'completed' && <p className="text-sm text-gray-300 mt-2">Grade: <span className="font-medium text-emerald-300">{course.grade}</span></p>}
    {type === 'saved' && <p className="text-sm text-gray-300 mt-2"><HeartIcon className="inline mr-1" /> {course.savedBy} saves</p>}
  </div>
);

const NotificationItem = ({ notification }) => (
  <div className="flex items-start p-4 bg-white/5 border border-white/10 backdrop-blur rounded-xl mb-2 shadow-sm">
    <div className={`p-2 rounded-full mr-3 text-white ${
      notification.type === 'feedback' ? 'bg-teal-500' :
      notification.type === 'social' ? 'bg-blue-500' : 'bg-green-500'
    }`}>      {notification.type === 'feedback' && <MessageCircleIcon />}
      {notification.type === 'social' && <UserIcon />}
      {notification.type === 'achievement' && <TrophyIcon />}
    </div>
    <div>
      <p className="text-sm text-gray-200">{notification.text}</p>
      <span className="text-xs text-gray-400 mt-1 block">{notification.date}</span>
    </div>
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
        <div className="bg-white/5 border border-white/10 backdrop-blur p-6 rounded-2xl shadow-md mb-4">
            <h4 className="font-semibold text-lg text-white mb-3">{isNew ? 'Add New Project' : `Edit Project: ${formData.title}`}</h4>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Title" required className="w-full p-2 rounded bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#167468]" />
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" required className="w-full p-2 rounded bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#167468]"></textarea>
              <select name="status" value={formData.status} onChange={handleChange} required className="w-full p-2 rounded bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#167468]">
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Stuck">Stuck</option>
                </select>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-[#167468] text-white rounded hover:opacity-95 disabled:opacity-50">
                      {isLoading ? 'Saving...' : (isNew ? 'Add Project' : 'Update Project')}
                    </button>
                    {isNew && onCancel && (
                      <button type="button" onClick={onCancel} disabled={isLoading} className="ml-3 px-3 py-2 bg-white/10 border border-white/10 text-white rounded hover:bg-white/15">
                        Cancel
                      </button>
                    )}
                  </div>
                  {!isNew && (
                    <button type="button" onClick={() => onDelete(project._id)} disabled={isLoading} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50">
                      Delete
                    </button>
                  )}
                </div>
            </form>
        </div>
    );
};

// --- Main Profile Page Component ---
const Profile = () => {
  const { currentUser, logout } = useAuth();
  const [friendInput, setFriendInput] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  // kept for backward compatibility with older bundles referencing it
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // user object when clicked
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friendRequests, setFriendRequests] = useState({ sent: [], received: [] });

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
  });

  

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
            // Mocking activity/social data as it's not returned by /me yet
            // *** CRITICAL FIX: Ensure activity/social objects are carried over ***
            // activity: data.activity || profileData.activity,
            // social: data.social || profileData.social,

            // Include existing activity/social data if available, or fall back to defaults
            activity: data.activity || profileData.activity || { lastActive: 'N/A', activeSessions: 0, totalMinutes: 0 }, 
            social: data.social || profileData.social || { followers: 0, following: 0, friends: [] },
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
    fetchFriendRequests();
  }, [fetchProfileData]);

  // Server-side search: query backend for matching users
  useEffect(() => {
    if (!friendInput || friendInput.trim() === '') {
      setFilteredUsers([]);
      setSelectedUser(null);
      setSearching(false);
      setHighlightedIndex(-1);
      return;
    }

    setSearching(true);
    const q = friendInput.trim();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/public/users?q=${encodeURIComponent(q)}`);
        if (!res.ok) {
          setFilteredUsers([]);
          setSearching(false);
          return;
        }
        const users = await res.json();
        setFilteredUsers(users || []);
        setHighlightedIndex(-1);
        // If exact match, mark selectedUser
        const exact = users && users.find(u => (u.username || '').toLowerCase() === q.toLowerCase());
        setSelectedUser(exact || null);
      } catch (err) {
        console.error('User search failed', err);
        setFilteredUsers([]);
      } finally {
        setSearching(false);
      }
    }, 220);

    return () => clearTimeout(t);
  }, [friendInput]);

  // Fetch public users for the live-search dropdown
  const fetchAllUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/public/users`);
      if (!res.ok) return;
      const data = await res.json();
      // store minimal fields
      setAllUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch users for search', err);
    }
  };

  // Toast helper using shared Toast component
  const showToast = (message, type = 'info', timeout = 3500) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), timeout);
  };

  const fetchFriendRequests = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/friend-requests`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setFriendRequests({ sent: data.sent || [], received: data.received || [] });
    } catch (err) {
      console.error('Failed to fetch friend requests', err);
    }
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
      }
    };

    const cancelDelete = () => setDeleteConfirmId(null);

    const handleAddFriend = async () => {
        const usernameToSend = selectedUser ? selectedUser.username : friendInput.trim();
        if (!usernameToSend) {
          showToast('Please enter a valid username.', 'error');
          return;
        }
        if (requestSent) {
          showToast('Friend request already sent.', 'info');
          return;
        }
        // Optimistic UI: add a pending sent request entry
        const username = usernameToSend;
        const pendingId = `pending-${Date.now()}`;
        const pendingUser = { _id: pendingId, username, profilePicture: '', role: selectedUser?.role || 'user' };
        setFriendRequests(prev => ({ ...prev, sent: [...(prev.sent || []), pendingUser] }));
        setRequestSent(true);
        showToast(`Friend request sent to ${username}`, 'info');

        try {
          const res = await fetch(`${API_BASE_URL}/user/friend-request-by-username`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username })
          });
          const result = await res.json().catch(()=>null);
          if (!res.ok) {
            // Revert optimistic update
            setFriendRequests(prev => ({ ...prev, sent: (prev.sent || []).filter(u => u._id !== pendingId) }));
            setRequestSent(false);
            showToast(result?.msg || 'Failed to send friend request', 'error');
          } else {
            showToast(`Friend request delivered to ${username}`, 'success');
          }
        } catch (err) {
          console.error(err);
          setFriendRequests(prev => ({ ...prev, sent: (prev.sent || []).filter(u => u._id !== pendingId) }));
          setRequestSent(false);
          showToast('Network error during friend request', 'error');
        }
    };

  const handleAcceptRequest = async (senderId) => {
    // Optimistic: remove from received and add to friends list
    const senderObj = friendRequests.received.find(u => String(u._id) === String(senderId));
    if (!senderObj) return showToast('Request not found', 'error');

    // Remove from received optimistically
    setFriendRequests(prev => ({ ...prev, received: (prev.received || []).filter(u => String(u._id) !== String(senderId)) }));
    // Add to friends optimistically
    setProfileData(prev => ({ ...prev, social: { ...(prev.social || {}), friends: [...(prev.social?.friends || []), senderObj] } }));
    showToast(`Accepted friend request from ${senderObj.username}`, 'success');

    try {
      const res = await fetch(`${API_BASE_URL}/user/friend-request/accept`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ senderId })
      });
      const result = await res.json().catch(()=>null);
      if (!res.ok) {
        // revert optimistic changes
        setFriendRequests(prev => ({ ...prev, received: [...(prev.received || []), senderObj] }));
        setProfileData(prev => ({ ...prev, social: { ...(prev.social || {}), friends: (prev.social?.friends || []).filter(f => String(f._id) !== String(senderId)) } }));
        showToast(result?.msg || 'Failed to accept friend request', 'error');
      }
    } catch (err) {
      console.error(err);
      // revert optimistic changes
      setFriendRequests(prev => ({ ...prev, received: [...(prev.received || []), senderObj] }));
      setProfileData(prev => ({ ...prev, social: { ...(prev.social || {}), friends: (prev.social?.friends || []).filter(f => String(f._id) !== String(senderId)) } }));
      showToast('Network error while accepting request', 'error');
    }
  };

  // Live-search logic (debounced) - filters `allUsers` by username matching the input
  useEffect(() => {
    if (!friendInput) {
      setFilteredUsers([]);
      setSelectedUser(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    const t = setTimeout(() => {
      const q = friendInput.trim().toLowerCase();
      const matches = allUsers.filter(u => (u.username || '').toLowerCase().includes(q));
      setFilteredUsers(matches.slice(0, 8));
      setSearching(false);
      // If exact single match, mark selectedUser automatically
      const exact = matches.find(m => (m.username || '').toLowerCase() === q);
      if (exact) setSelectedUser(exact);
      else setSelectedUser(null);
    }, 220);

    return () => clearTimeout(t);
  }, [friendInput, allUsers]);

  // Clicking a suggestion fills the input and selects the user
  const handleSelectSuggestion = (user) => {
    setFriendInput(user.username);
    setSelectedUser(user);
    setFilteredUsers([]);
  };

  const handleDeclineRequest = async (otherUserId) => {
    // Optimistic: remove from received/sent immediately
    const wasReceived = (friendRequests.received || []).some(u => String(u._id) === String(otherUserId));
    const removedFromReceived = (friendRequests.received || []).filter(u => String(u._id) !== String(otherUserId));
    const removedFromSent = (friendRequests.sent || []).filter(u => String(u._id) !== String(otherUserId));
    setFriendRequests(prev => ({ ...prev, received: removedFromReceived, sent: removedFromSent }));
    showToast('Friend request removed', 'info');

    try {
      const res = await fetch(`${API_BASE_URL}/user/friend-request/decline`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ otherUserId })
      });
      const result = await res.json().catch(()=>null);
      if (!res.ok) {
        // revert
        setFriendRequests(prev => ({ ...prev, received: wasReceived ? [...(prev.received || []), { _id: otherUserId }] : prev.received, sent: prev.sent }));
        showToast(result?.msg || 'Failed to remove request', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while declining request', 'error');
    }
  };

  // Unfollow handler: calls backend and updates UI optimistically
  const handleUnfollow = async (targetId) => {
    if (!targetId) return;
    const wasFollowing = (profileData.social?.followingList || []).some(id => String(id) === String(targetId));
    const prevFollowingList = profileData.social?.followingList || [];
    const prevFollowingCount = profileData.social?.following || 0;

    if (wasFollowing) {
      // Optimistic update
      setProfileData(prev => ({
        ...prev,
        social: {
          ...(prev.social || {}),
          followingList: prevFollowingList.filter(id => String(id) !== String(targetId)),
          following: Math.max(0, (prev.social?.following || 0) - 1)
        }
      }));
    }

    try {
      const res = await fetch(`${API_BASE_URL}/user/unfollow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: targetId })
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) {
        // revert optimistic
        setProfileData(prev => ({
          ...prev,
          social: {
            ...(prev.social || {}),
            followingList: prevFollowingList,
            following: prevFollowingCount
          }
        }));
        showToast(result?.msg || 'Failed to unfollow', 'error');
      } else {
        showToast(result?.msg || 'Unfollowed', 'success');
      }
    } catch (err) {
      console.error('Unfollow error', err);
      // revert optimistic
      setProfileData(prev => ({
        ...prev,
        social: {
          ...(prev.social || {}),
          followingList: prevFollowingList,
          following: prevFollowingCount
        }
      }));
      showToast('Network error during unfollow', 'error');
    }
  };




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
  const quizzes = { completed: 0, averageScore: '', lastQuiz: '' };
  const contests = [];
  const notifications = [];

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
    return <div className="flex justify-center items-center h-screen bg-slate-950 text-white">
      <div className="text-xl font-medium text-gray-200">Loading Profile...</div>
    </div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen bg-slate-950 text-red-400 p-4">Error: {error}. Please try logging in again.</div>;
  }


const currentProfilePicUrl = profileData.profilePicture
  ? profileData.profilePicture.startsWith('data:')
      ? profileData.profilePicture
      : `data:image/png;base64,${profileData.profilePicture}`
  : 'https://placehold.co/150x150/cccccc/ffffff?text=Profile';


  // Helper for rendering skill inputs
  const renderSkillSection = (field, title, description) => (
      <div key={field} className="mt-4 p-4 border border-white/10 rounded-xl bg-white/5">
        <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-white">{title}</h4>
            {/* <h3>{title}</h3> */}
    {/* <ul>
      {profileData[field]?.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul> */}

            <button onClick={() => setEditing(prev => ({ ...prev, [field]: !prev[field] }))} className="text-sm text-teal-300 hover:underline">
                {editing[field] ? 'Cancel' : 'Edit'}
            </button>
        </div>

        
        {editing[field] ? (
            <>
               
                <div className="flex flex-wrap gap-2 items-center">
  {profileData[field]?.map((item, i) => (
    <div
      key={i}
      className="flex items-center bg-white/10 border border-white/10 text-white/80 text-sm font-medium px-2 py-1 rounded-full"
    >
      <span>{item}</span>
      <button
        onClick={() => handleRemoveSkill(field, item)}
        className="ml-2 text-white/70 hover:text-red-400 focus:outline-none"
        aria-label={`Remove ${item}`}
      >
        &times;
      </button>
    </div>
  ))}
</div>
    
    <input
      type="text"
          className="w-full p-2 rounded mt-2 bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#167468]"
      value={tempData[field] || ''}
      onChange={e => setTempData(prev => ({ ...prev, [field]: e.target.value }))}
      placeholder={`Add ${title.toLowerCase().slice(0, -1)}`}
    />

        <button className='mt-2 px-3 py-1 bg-gradient-to-r from-purple-500 to-[#167468] text-white rounded hover:opacity-95 disabled:opacity-50 text-sm' onClick={() => handleAddSkill(field, tempData[field])}>
      {loading ? 'Saving...' : `Add ${title}`}
    </button>
                    <p className="text-xs mt-3 text-gray-400">{description}</p>
             

            </>
        ) : (
            <div className="flex flex-wrap gap-2">
                {profileData[field].length > 0 ? (
              profileData[field].map((skill, index) => (
                <span key={index} className="bg-white/10 border border-white/10 text-white/80 text-sm font-medium px-3 py-1 rounded-full">{skill}</span>
              ))
            ) : (
                    <p className="text-sm text-gray-400">Add Your Skills.</p>
                )}
            </div>
        )}
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-4 sm:p-8">
      {/* Toast container (shared) */}
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold text-white">My Dashboard</h1>
          <p className="mt-2 text-lg text-gray-300">Welcome back, {profileData.username}!</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Info and Dashboard */}
          <div className="lg:col-span-2 space-y-8">
            <PageSection title="My Profile">
              <div className="flex flex-col md:flex-row items-center bg-white/5 border border-white/10 backdrop-blur p-8 rounded-2xl shadow-lg">
                {/* PROFILE PICTURE SECTION */}
                <div className="relative mb-4 md:mb-0 md:mr-6">
                  <img 
                    src={currentProfilePicUrl} 
                    alt="Profile" 
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white/10 object-cover" 
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
                      className="absolute bottom-0 right-0 bg-white/10 text-white p-1 rounded-full border-2 border-white/10 hover:bg-white/15 transition-colors"
                        title="Change Picture"
                    >
                        <UserPlusIcon className="w-4 h-4"/>
                    </button>
                </div>

                {/* PROFILE INFO DISPLAY/EDIT */}
                <div className="text-center md:text-left flex-grow">
                  <div className="flex flex-wrap items-center md:justify-start justify-center mb-2">
                    {editing.username ? (
                        <input 
                          type="text" 
                          name="username" 
                          value={tempData.username} 
                          onChange={handleTempChange} 
                          className="text-2xl font-bold text-white border border-white/10 p-1 rounded mr-2 bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#167468]"
                        />
                    ) : (
                        <h3 className="text-2xl font-bold text-white mr-2">{profileData.username}</h3>
                    )}
                    
                    <span className="inline-block bg-white/10 border border-white/10 text-white/80 text-xs font-semibold px-2.5 py-0.5 rounded-full">{profileData.role}</span>
                    {profileData.role === 'staff' && (
                      <span className="inline-flex items-center ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/80">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.95a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 0 0-.364 1.118l1.286 3.95c.3.921-.755 1.688-1.54 1.118L10 13.347l-3.37 2.448c-.784.57-1.84-.197-1.54-1.118l1.286-3.95a1 1 0 0 0-.364-1.118L2.642 9.377c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.95z"/></svg>
                        Staff
                      </span>
                    )}
                  </div>

                  <p className="text-md text-gray-300 mb-2">{profileData.email}</p>

                  {/* BIO EDITING */}
                  <div className="mt-3">
                    <div className="flex items-center justify-center md:justify-start mb-1">
                      <span className="text-sm font-medium text-gray-200 mr-2">Bio:</span>
                        {!editing.bio ? (
                        <span className="text-gray-200 max-w-xl italic">{profileData.bio || 'No bio set.'}</span>
                        ) : (
                            <textarea 
                                name="bio" 
                                value={tempData.bio} 
                                onChange={handleTempChange} 
                          className="w-full md:w-96 border border-white/10 bg-white/5 text-white p-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#167468]"
                                rows="3"
                            />
                        )}
                      <button onClick={() => setEditing(prev => ({...prev, bio: !prev.bio}))} className="ml-2 text-xs text-teal-300 hover:underline">
                            {editing.bio ? 'Cancel' : 'Edit'}
                        </button>
                    </div>
                  </div>
                  
                    {/* Save Button for Basic Fields */}
                    {(editing.username || editing.bio) && (
                        <button 
                            onClick={handleProfileUpdate} 
                            disabled={loading}
                        className="mt-3 px-4 py-2 bg-gradient-to-r from-purple-500 to-[#167468] text-white rounded hover:opacity-95 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Saving...' : 'Save Edits'}
                        </button>
                    )}
                </div>
                
                {/* Picture Removal */}
                {profileData.profilePicture && (
                   <button onClick={handleRemovePicture} className="text-teal-300 text-sm hover:underline mt-2 md:ml-4">Remove Picture</button>
                )}
              </div>





              {/* SKILLS SECTION */}
              <div className="mt-6 p-6 bg-white/5 border border-white/10 backdrop-blur rounded-2xl shadow-lg">
                <h3 className="text-xl font-semibold text-white mb-2">Skills</h3>
                {renderSkillSection('technicalSkills', 'Technical Skills', 'List all your technical proficiencies.')}
                {renderSkillSection('softSkills', 'Soft Skills', 'List all your soft skills.')}
                {renderSkillSection('skillsToLearn', 'Skills to Learn', 'List all skills you want to acquire.')}
                {renderSkillSection('extraCurricular', 'Extra Curricular Activities', 'List all activities.')}
                
                {/* OTHER FIELD */}
                <div className="mt-4 p-4 border border-white/10 rounded-xl bg-white/5">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-white">Other Information</h4>
                        <button onClick={() => setEditing(prev => ({ ...prev, other: !prev.other }))} className="text-sm text-teal-300 hover:underline">
                            {editing.other ? 'Cancel' : 'Edit'}
                        </button>
                    </div>
                    {editing.other ? (
                        <textarea
                            name="other"
                            value={tempData.other}
                            onChange={handleTempChange}
                            placeholder="Any other relevant information..."
                          className="w-full p-2 border border-white/10 rounded mb-2 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#167468]"
                            rows="3"
                        />
                    ) : (
                        <p className="flex items-center bg-white/10 border border-white/10 text-white/80 text-sm font-medium px-2 py-1 rounded-full">{profileData.other || 'No other information provided.'}</p>
                    )}
           
                {/* Save button for Skills/Other if any are being edited */}
                {( editing.other) && (
               <button
                        onClick={handleProfileUpdate}
                        disabled={loading}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-[#167468] text-white rounded hover:opacity-95 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Saving...' : 'Save other Information'}
                    </button>
                )}
                </div>

  


              </div>


            </PageSection>

            {/* Dashboard Cards (Mocked Data) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <DashboardCard icon={<BookOpenIcon />} title="Enrolled Courses" value={courses.enrolled.length} color="bg-teal-500" />
                  <DashboardCard icon={<TrophyIcon />} title="Certifications" value={certifications.length} color="bg-green-500" />
                  <DashboardCard icon={<CodeIcon />} title="Projects" value={profileData.projects.length} color="bg-blue-500" />
            </div>

            {/* Courses Section (Mocked Data) */}
            <PageSection title="My Courses">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-white">Currently Pursuing</h3>
                  <div className="space-y-4">
                    {courses.enrolled.length > 0 ? (
                      courses.enrolled.map(course => <CourseCard key={course.id} course={course} type="enrolled" />)
                    ) : (
                      <p className="text-gray-400">No enrolled courses.</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-white">Completed</h3>
                  <div className="space-y-4">
                    {courses.completed.length > 0 ? (
                      courses.completed.map(course => <CourseCard key={course.id} course={course} type="completed" />)
                    ) : (
                      <p className="text-gray-400">No completed courses.</p>
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
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-[#167468] text-white rounded hover:opacity-95"
                    onClick={() => setShowNewProjectForm(true)}
                  >
                    Add New Project
                  </button>
                ) : (
                  <div>
                    <ProjectForm isNew={true} onSubmit={handleProjectSubmit} onCancel={() => setShowNewProjectForm(false)} />
                    <div className="mt-2">
                      <button className="px-3 py-1 text-sm text-gray-300 hover:underline" onClick={() => setShowNewProjectForm(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.length > 0 ? (
                  projects.map(project => (
                    <div key={project._id} className="bg-white/5 border border-white/10 backdrop-blur p-6 rounded-2xl shadow-md">
                      <h4 className="font-semibold text-lg text-white">{project.title}</h4>
                      <p className="text-sm text-gray-300 mt-2">{project.description}</p>
                      <span className={`inline-block mt-3 text-xs font-semibold px-2.5 py-0.5 rounded-full ${project.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : project.status === 'Stuck' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                        {project.status}
                      </span>
                      <div className="mt-3 pt-2 border-t border-white/10">
                        <ProjectForm 
                            project={project} 
                            isNew={false} 
                            onSubmit={handleProjectSubmit} 
                            onDelete={handleDeleteProject}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No projects yet. Add one above!</p>
                )}
              </div>

              {/* Non-blocking delete confirmation modal */}
              {deleteConfirmId && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                  <div className="bg-slate-950 border border-white/10 rounded-2xl p-6 shadow-lg w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-3 text-white">Confirm Delete</h3>
                    <p className="text-sm text-gray-300 mb-4">Are you sure you want to delete this project? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                      <button onClick={cancelDelete} className="px-4 py-2 bg-white/10 border border-white/10 text-white rounded hover:bg-white/15">Cancel</button>
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
                    <div key={cert.id} className="bg-white/5 border border-white/10 backdrop-blur p-6 rounded-2xl shadow-md">
                      <h4 className="font-semibold text-lg text-white">{cert.title}</h4>
                      <p className="text-sm text-gray-300 mt-2">Provider: {cert.provider}</p>
                      <p className="text-sm text-gray-300 mt-1">Date: {cert.date}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No certifications earned yet.</p>
                )}
              </div>
            </PageSection>

            {/* Saved Courses (Mocked Data) */}
            <PageSection title="Saved Courses">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.saved.length > 0 ? (
                  courses.saved.map(course => <CourseCard key={course.id} course={course} type="saved" />)
                ) : (
                  <p className="text-gray-400">No saved courses.</p>
                )}
              </div>
            </PageSection>
          </div>

          {/* Sidebar Section (Kept as is, Mocked Data) */}
          <div className="lg:col-span-1 space-y-8">
            {/* User Activity (Mocked) */}
            <PageSection title="My Activity">
              <div className="bg-white/5 border border-white/10 backdrop-blur p-6 rounded-2xl shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BookOpenIcon className="text-xl text-teal-500 mr-3" />
                    <span className="text-sm font-medium text-gray-300">Quizzes Completed</span>
                  </div>
                  <span className="font-bold text-white">{quizzes.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <RunningWithErrorsIcon className="text-xl text-yellow-500 mr-3" />
                    <span className="text-sm font-medium text-gray-300">Contests Participated</span>
                  </div>
                  <span className="font-bold text-white">{contests.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrophyIcon className="text-xl text-green-500 mr-3" />
                    <span className="text-sm font-medium text-gray-300">Average Quiz Score</span>
                  </div>
                  <span className="font-bold text-white">{quizzes.averageScore}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <HeartIcon className="text-xl text-red-500 mr-3" />
                    <span className="text-sm font-medium text-gray-300">Last Active</span>
                  </div>
                  <span className="font-bold text-white">{profileData.activity?.lastActive || 'N/A'}</span>
                </div>

              </div>
            </PageSection>

            {/* Notifications (Mocked) */}
            <PageSection title="Notifications">
              <div className="bg-white/5 border border-white/10 backdrop-blur p-6 rounded-2xl shadow-lg">
                {notifications.length > 0 ? (
                  notifications.map(notification => <NotificationItem key={notification.id} notification={notification} />)
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No new notifications.</p>
                )}
                <div className="text-right mt-4">
                  <a href="#" className="text-sm font-medium text-teal-300 hover:underline">View All</a>
                </div>
              </div>
            </PageSection>

            {/* Social & Community (Mocked) */}
            <PageSection title="Community">
              <div className="bg-white/5 border border-white/10 backdrop-blur p-6 rounded-2xl shadow-lg space-y-4">
                <div className="flex justify-around text-center">
                  <div>
                    <h3 className="text-3xl font-bold text-teal-300">{profileData.social?.followers || 0}</h3>
                    <p className="text-sm text-gray-400">Followers</p>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-teal-300">{profileData.social?.following || 0}</h3>
                    <p className="text-sm text-gray-400">Following</p>
                  </div>
                </div>
                <hr className="border-white/10" />
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Friends</h4>
                  <div className="space-y-3">
                      {profileData.social?.friends?.length > 0 ? (
                        profileData.social.friends.map(friend => (
                          <div key={friend._id || friend.id} className="flex items-center">
                            <img src={normalizeImageSrc(friend.profilePicture || friend.pic || '')} alt={friend.username || friend.name} className="w-8 h-8 rounded-full border-2 border-white/10" />
                            <span className="ml-3 text-sm text-gray-200">{friend.username || friend.name}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">No friends to display.</p>
                      )}
                  </div>
                </div>
                <hr className="border-white/10" />
                  {/* Incoming Friend Requests */}
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Incoming Requests</h4>
                    {friendRequests.received.length > 0 ? (
                      friendRequests.received.map(u => (
                        <div key={u._id} className="flex items-center justify-between p-3 border border-white/10 rounded-xl mb-2 bg-white/5">
                          <div className="flex items-center">
                            <img src={normalizeImageSrc(u.profilePicture || '')} className="w-8 h-8 rounded-full mr-3" alt={u.username} />
                            <div>
                              <div className="font-medium text-white">{u.username}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{u.role}</div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 w-full">
                            <button onClick={() => handleAcceptRequest(u._id)} className="w-full sm:w-auto px-3 py-1 bg-gradient-to-r from-purple-500 to-[#167468] text-white rounded">Accept</button>
                            <button onClick={() => handleDeclineRequest(u._id)} className="w-full sm:w-auto px-3 py-1 bg-white/10 border border-white/10 text-white rounded hover:bg-white/15">Decline</button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No incoming requests.</p>
                    )}
                  </div>
                  {/* Outgoing (Sent) Friend Requests */}
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Sent Requests</h4>
                    {friendRequests.sent.length > 0 ? (
                      friendRequests.sent.map(u => (
                        <div key={u._id} className="flex items-center justify-between p-3 border border-white/10 rounded-xl mb-2 bg-white/5">
                          <div className="flex items-center">
                            <img src={normalizeImageSrc(u.profilePicture || '')} className="w-8 h-8 rounded-full mr-3" alt={u.username} />
                            <div>
                              <div className="font-medium text-white">{u.username}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{u.role}</div>
                            </div>
                          </div>
                          <div className="w-full sm:w-auto">
                            <button onClick={() => handleDeclineRequest(u._id)} className="w-full sm:w-auto px-3 py-1 bg-red-500 text-white rounded">Cancel</button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No sent requests.</p>
                    )}
                  </div>
                  {/* Friend Connection Section (Kept as is) */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Find and Connect</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
                    <input
                      type="text"
                      value={friendInput}
                      onChange={(e) => { setFriendInput(e.target.value); setRequestSent(false); }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setHighlightedIndex(i => Math.min(i + 1, filteredUsers.length - 1));
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setHighlightedIndex(i => Math.max(i - 1, 0));
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          if (highlightedIndex >= 0 && filteredUsers[highlightedIndex]) {
                            handleSelectSuggestion(filteredUsers[highlightedIndex]);
                          } else {
                            handleAddFriend();
                          }
                        } else if (e.key === 'Escape') {
                          setFilteredUsers([]);
                          setHighlightedIndex(-1);
                        }
                      }}
                      placeholder="Enter username to add"
                      className="flex-1 px-4 py-2 border border-white/10 rounded-full bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#167468] transition-shadow"
                    />
                    <button
                      onClick={handleAddFriend}
                      className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-[#167468] text-white p-2 rounded-full shadow-lg hover:opacity-95 transition-colors duration-200"
                    >
                      <UserPlusIcon />
                    </button>
                  </div>
                    {/* Suggestions dropdown */}
                    <div className="relative mt-2">
                      {searching && <div className="text-sm text-gray-500 dark:text-gray-400">Searching...</div>}
                      {!searching && filteredUsers.length > 0 && (
                        <div className="absolute z-20 w-full bg-slate-950 border border-white/10 rounded-xl shadow-lg max-h-56 overflow-auto">
                          {filteredUsers.map((u, idxMap) => {
                            const uname = u.username || '';
                            const q = friendInput.trim();
                            const idx = uname.toLowerCase().indexOf(q.toLowerCase());
                            const isHighlighted = idxMap === highlightedIndex;
                            const isSent = (friendRequests.sent || []).some(s => String(s._id) === String(u._id) || (s.username && s.username === u.username));
                            const isFriend = (profileData.social?.friends || []).some(f => String(f) === String(u._id) || String(f._id) === String(u._id));
                            const isFollowing = (profileData.social?.followingList || []).some(f => String(f) === String(u._id));
                              return (
                              <div key={u._id} className={`w-full text-left px-3 py-2 flex items-center ${isHighlighted ? 'bg-white/10' : 'hover:bg-white/10'}`}>
                                <button
                                  onClick={() => handleSelectSuggestion(u)}
                                  className="flex-1 text-left flex items-center"
                                >
                                  <img src={normalizeImageSrc(u.profilePicture || 'https://placehold.co/40x40/cccccc/ffffff?text=U')} alt={uname} className="w-8 h-8 rounded-full mr-3" />
                                  <div>
                                    <div className="text-sm font-medium text-white">
                                      {idx >= 0 ? (
                                        <>
                                          {uname.substring(0, idx)}
                                          <span className="bg-yellow-200 px-1 rounded">{uname.substring(idx, idx + q.length)}</span>
                                          {uname.substring(idx + q.length)}
                                        </>
                                      ) : uname}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{u.role || 'user'}</div>
                                  </div>
                                </button>
                                <div className="ml-2 w-full sm:w-auto">
                                  {isFollowing ? (
                                    <button onClick={() => handleUnfollow(u._id)} className="w-full sm:w-auto px-2 py-1 bg-white/10 border border-white/10 text-white rounded text-sm hover:bg-white/15">Unfollow</button>
                                  ) : isSent ? (
                                    <button onClick={() => handleDeclineRequest(u._id)} className="w-full sm:w-auto px-2 py-1 bg-red-500 text-white rounded text-sm">Cancel</button>
                                  ) : (
                                    <button onClick={() => { handleSelectSuggestion(u); handleAddFriend(); }} className="w-full sm:w-auto px-2 py-1 bg-gradient-to-r from-purple-500 to-[#167468] text-white rounded text-sm hover:opacity-95">Add</button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* If an exact user is selected or matched, show exist message */}
                      {selectedUser && (
                        <div className="mt-2 text-sm text-emerald-300">User <span className="font-semibold">{selectedUser.username}</span> exists. Click add to send a request.</div>
                      )}
                      {/* If no matches and input present */}
                      {!searching && friendInput && filteredUsers.length === 0 && (
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">No users found with "{friendInput}"</div>
                      )}
                    </div>
                  {requestSent && (
                    <p className="mt-2 text-sm text-green-600 text-center">
                      Friend request sent!
                    </p>
                  )}
                </div>
              </div>
            </PageSection>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;