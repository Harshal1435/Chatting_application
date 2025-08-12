import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaUserEdit, FaUserPlus, FaUserMinus, FaCheck, FaTimes } from 'react-icons/fa';
import { FiImage, FiBookmark, FiSettings, FiCamera } from 'react-icons/fi';
import { useAuth } from '../context/AuthProvider';
import { Link } from 'react-router-dom';


const ProfileView = () => {
  const { userId } = useParams();
 const [authUser] = useAuth();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const token = JSON.parse(localStorage.getItem('token'));
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditOpen, setIsEditOpen] = useState(false);
   const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [formData, setFormData] = useState({
    fullname: '',
    isPrivate: false,
    avatar: null
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const fileInputRef = useRef(null);

  const authAxios = axios.create({
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
      
    }
  });

    const authAxios2 = axios.create({
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      
    }
  });

  useEffect(() => {
    setLoggedInUser(authUser?.user);
  }, [authUser]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await authAxios.get(`${BASE_URL}/api/user/profile/${userId}`);
        setProfileUser(data);
        
        if (loggedInUser && loggedInUser._id !== userId) {
          setIsFollowing(data.followers.some(f => f._id === loggedInUser._id));
          setHasRequested(data.followRequests.includes(loggedInUser._id));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchProfile();
  }, [userId, loggedInUser, token]);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, avatar: file });
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setFormData({ ...formData, avatar: null });
    setAvatarPreview(null);
  };

  const handleFollow = async () => {
    try {
      await authAxios2.post(`${BASE_URL}/api/user/follow`, { targetUserId: userId });
      if (profileUser.isPrivate) {
        setHasRequested(true);
      } else {
        setIsFollowing(true);
        setProfileUser(prev => ({
          ...prev,
          followers: [...prev.followers, { _id: loggedInUser._id, username: loggedInUser.username }]
        }));
      }
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  const handleUnfollow = async () => {
    try {
      console.log('Unfollowing user:', userId);
      await authAxios.post(`${BASE_URL}/api/user/unfollow/${userId}`);
      setIsFollowing(false);
      setProfileUser(prev => ({
        ...prev,
        followers: prev.followers.filter(f => f._id !== loggedInUser._id)
      }));
    } catch (err) {
      console.error('Unfollow error:', err);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('fullname', formData.fullname);
      formDataToSend.append('isPrivate', formData.isPrivate);
      if (formData.avatar) {
        formDataToSend.append('avatar', formData.avatar);
      }

      const { data } = await authAxios.put(`${BASE_URL}/api/user/profile/${userId}`, formDataToSend);
      setProfileUser(data);
      setIsEditOpen(false);
      setAvatarPreview(null);
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-red-500 text-lg">{error}</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
        <div className="relative group">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-gray-200">
            <img 
              src={avatarPreview || profileUser?.avatar || '/default-avatar.png'} 
              alt={profileUser?.fullname}
              className="w-full h-full object-cover"
            />
          </div>
          
          {loggedInUser?._id === userId && (
            <>
              <button 
                onClick={() => fileInputRef.current.click()}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <FiCamera className="text-white text-2xl" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <Link to="/create-post">
              Add Post
              </Link>
            </>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-light">{profileUser?.fullname}</h1>
            
            {loggedInUser?._id === userId ? (
              <>
                <button 
                  onClick={() => setIsEditOpen(true)}
                  className="px-4 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium flex items-center gap-2"
                >
                  <FaUserEdit /> Edit Profile
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100">
                  <FiSettings className="text-xl" />
                </button>
              </>
            ) : (
              <>
                {isFollowing ? (
                  <button 
                    onClick={handleUnfollow}
                    className="px-4 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium flex items-center gap-2"
                  >
                    <FaUserMinus /> Following
                  </button>
                ) : hasRequested ? (
                  <button className="px-4 py-1 bg-gray-100 rounded-md text-sm font-medium flex items-center gap-2" disabled>
                    <FaCheck /> Requested
                  </button>
                ) : (
                  <button 
                    onClick={handleFollow}
                    className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium flex items-center gap-2"
                  >
                    <FaUserPlus /> Follow
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex gap-8">
            <div><span className="font-semibold">{profileUser?.post?.length || 0}</span> posts</div>
            <div><span className="font-semibold">{profileUser?.followers?.length || 0}</span> followers</div>
            <div><span className="font-semibold">{profileUser?.following?.length || 0}</span> following</div>
          </div>

          <div>
            <p className="font-semibold">{profileUser?.fullname}</p>
            <p className="text-gray-600">{profileUser?.bio}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-gray-200">
        <div className="flex justify-center gap-16">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 py-4 px-1 border-t ${activeTab === 'posts' ? 'border-black font-semibold' : 'border-transparent'}`}
          >
            <FiImage /> POSTS
          </button>
          <button 
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 py-4 px-1 border-t ${activeTab === 'saved' ? 'border-black font-semibold' : 'border-transparent'}`}
          >
            <FiBookmark /> SAVED
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-3 gap-1 mt-4">
        {profileUser?.post?.map(post => (
       <div key={post._id} className="aspect-square bg-gray-100">
        <Link to={`/posts/${post._id}`}>
            <img 
              src={post.mediaUrl} 
              alt={post.caption} 
              className="w-full h-full object-cover"
            />
            </Link>
          </div>
        
        ))}
      </div>

      {
        console.log("profileUser",profileUser)
      }

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Profile</h2>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                      <img 
                        src={avatarPreview || profileUser?.avatar || '/default-avatar.png'} 
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
                    >
                      <FiCamera className="text-sm" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Remove photo
                    </button>
                  )}
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullname}
                    onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder={profileUser?.fullname}
                  />
                </div>

                {/* Private Account */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="privateAccount"
                    checked={formData.isPrivate}
                    onChange={(e) => setFormData({...formData, isPrivate: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="privateAccount">Private Account</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditOpen(false);
                    setAvatarPreview(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;