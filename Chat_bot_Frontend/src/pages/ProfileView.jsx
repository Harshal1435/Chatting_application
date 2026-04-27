import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FaUserEdit, FaUserPlus, FaUserMinus, FaCheck, FaTimes } from 'react-icons/fa';
import { FiImage, FiBookmark, FiSettings, FiCamera } from 'react-icons/fi';
import { useAuth } from '../context/AuthProvider';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ProfileView = () => {
  const { userId } = useParams();
  const [authUser] = useAuth();
  const token = (() => { try { return JSON.parse(localStorage.getItem('token')); } catch { return null; } })();

  const [profileUser, setProfileUser]   = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [activeTab, setActiveTab]       = useState('posts');
  const [isEditOpen, setIsEditOpen]     = useState(false);
  const [isFollowing, setIsFollowing]   = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [formData, setFormData] = useState({ fullname: '', isPrivate: false, avatar: null });
  const fileInputRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { setLoggedInUser(authUser?.user); }, [authUser]);

  useEffect(() => {
    if (!token) return;
    const fetch = async () => {
      try {
        const { data } = await axios.get(`${BASE_URL}/api/user/profile/${userId}`, { headers });
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
    fetch();
  }, [userId, loggedInUser, token]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData(f => ({ ...f, avatar: file }));
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleFollow = async () => {
    try {
      await axios.post(`${BASE_URL}/api/user/follow`, { targetUserId: userId }, { headers: { ...headers, 'Content-Type': 'application/json' } });
      if (profileUser.isPrivate) {
        setHasRequested(true);
      } else {
        setIsFollowing(true);
        setProfileUser(p => ({ ...p, followers: [...p.followers, { _id: loggedInUser._id }] }));
      }
    } catch (_) {}
  };

  const handleUnfollow = async () => {
    try {
      await axios.post(`${BASE_URL}/api/user/unfollow/${userId}`, {}, { headers });
      setIsFollowing(false);
      setProfileUser(p => ({ ...p, followers: p.followers.filter(f => f._id !== loggedInUser._id) }));
    } catch (_) {}
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('fullname', formData.fullname || profileUser.fullname);
      fd.append('isPrivate', formData.isPrivate);
      if (formData.avatar) fd.append('avatar', formData.avatar);
      const { data } = await axios.put(`${BASE_URL}/api/user/profile/${userId}`, fd, { headers });
      setProfileUser(data);
      setIsEditOpen(false);
      setAvatarPreview(null);
    } catch (_) {}
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-white dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center h-screen bg-white dark:bg-gray-900">
      <p className="text-red-500 text-lg">{error}</p>
    </div>
  );

  const isOwner = loggedInUser?._id === userId;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ── Profile Header ── */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
          {/* Avatar */}
          <div className="relative group flex-shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
              <img
                src={avatarPreview || profileUser?.avatar || 'https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_1280.png'}
                alt={profileUser?.fullname}
                className="w-full h-full object-cover"
              />
            </div>
            {isOwner && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiCamera className="text-white text-2xl" />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
              </>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-2xl font-light">{profileUser?.fullname}</h1>

              {isOwner ? (
                <>
                  <button
                    onClick={() => { setFormData({ fullname: profileUser.fullname, isPrivate: profileUser.isPrivate, avatar: null }); setIsEditOpen(true); }}
                    className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <FaUserEdit /> Edit Profile
                  </button>
                  <Link to="/create-post" className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                    + Post
                  </Link>
                </>
              ) : isFollowing ? (
                <button onClick={handleUnfollow} className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                  <FaUserMinus /> Following
                </button>
              ) : hasRequested ? (
                <button disabled className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 opacity-60">
                  <FaCheck /> Requested
                </button>
              ) : (
                <button onClick={handleFollow} className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                  <FaUserPlus /> Follow
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="flex justify-center md:justify-start gap-8 text-sm">
              <div><span className="font-semibold">{profileUser?.post?.length || 0}</span> <span className="text-gray-500 dark:text-gray-400">posts</span></div>
              <div><span className="font-semibold">{profileUser?.followers?.length || 0}</span> <span className="text-gray-500 dark:text-gray-400">followers</span></div>
              <div><span className="font-semibold">{profileUser?.following?.length || 0}</span> <span className="text-gray-500 dark:text-gray-400">following</span></div>
            </div>

            {profileUser?.bio && <p className="text-gray-600 dark:text-gray-400 text-sm">{profileUser.bio}</p>}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-center gap-12">
            {[{ id: 'posts', icon: <FiImage />, label: 'POSTS' }, { id: 'saved', icon: <FiBookmark />, label: 'SAVED' }].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-t-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Posts Grid ── */}
        <div className="grid grid-cols-3 gap-1 mt-4">
          {profileUser?.post?.map(post => (
            <Link key={post._id} to={`/posts/${post._id}`} className="aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden group">
              <img src={post.mediaUrl} alt={post.caption} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
            </Link>
          ))}
          {(!profileUser?.post || profileUser.post.length === 0) && (
            <div className="col-span-3 py-16 text-center text-gray-400 dark:text-gray-500">
              No posts yet
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Profile</h2>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                    <img src={avatarPreview || profileUser?.avatar || 'https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_1280.png'} alt="preview" className="w-full h-full object-cover" />
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full hover:bg-blue-600 transition-colors">
                    <FiCamera className="text-xs" />
                  </button>
                </div>
                {avatarPreview && (
                  <button type="button" onClick={() => { setAvatarPreview(null); setFormData(f => ({ ...f, avatar: null })); }} className="text-xs text-red-500 hover:text-red-600">
                    Remove photo
                  </button>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.fullname}
                  onChange={(e) => setFormData(f => ({ ...f, fullname: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Private */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData(f => ({ ...f, isPrivate: e.target.checked }))}
                  className="w-4 h-4 accent-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Private Account</span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
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
