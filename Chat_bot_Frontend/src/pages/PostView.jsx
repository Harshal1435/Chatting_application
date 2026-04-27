import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaHeart, FaRegHeart, FaComment, FaArrowLeft, FaTrash } from "react-icons/fa";
import { useAuth } from "../context/AuthProvider";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_1280.png";

const getToken = () => {
  try {
    const raw = localStorage.getItem("token");
    if (!raw) return null;
    return raw.startsWith('"') ? JSON.parse(raw) : raw;
  } catch { return null; }
};

const PostView = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [authUser]   = useAuth();
  const loggedInUser = authUser?.user;

  const [post,         setPost]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [commentText,  setCommentText]  = useState("");
  const [submitting,   setSubmitting]   = useState(false);

  const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

  const fetchPost = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/post/${id}`, { headers: authHeaders() });
      setPost(res.data);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPost(); }, [id]);

  // ── Like / Unlike ──────────────────────────────────────────────────────────
  const handleLike = async () => {
    try {
      await axios.put(`${BASE_URL}/api/post/${id}/like`, {}, { headers: authHeaders() });
      // Optimistic update
      setPost(p => {
        const alreadyLiked = p.likes?.some(u => (u._id || u) === loggedInUser._id);
        return {
          ...p,
          likes: alreadyLiked
            ? p.likes.filter(u => (u._id || u) !== loggedInUser._id)
            : [...(p.likes || []), { _id: loggedInUser._id }],
        };
      });
    } catch (_) {}
  };

  // ── Comment ────────────────────────────────────────────────────────────────
  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/api/post/${id}/comment`,
        { text: commentText },
        { headers: { ...authHeaders(), "Content-Type": "application/json" } }
      );
      // Backend returns populated comments array
      setPost(p => ({ ...p, comments: res.data.comments }));
      setCommentText("");
    } catch (_) {
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
    </div>
  );

  if (!post) return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500 dark:text-gray-400">Post not found.</p>
      <button onClick={() => navigate(-1)} className="text-blue-500 text-sm hover:underline">Go back</button>
    </div>
  );

  const isLiked   = post.likes?.some(u => (u._id || u) === loggedInUser?._id);
  const isAuthor  = post.author?._id === loggedInUser?._id;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-xl mx-auto px-4 py-6">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-5 transition-colors"
        >
          <FaArrowLeft size={12} /> Back
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">

          {/* Author row */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
            <Link to={`/profile/${post.author?._id}`} className="flex items-center gap-3 group">
              <img
                src={post.author?.avatar || DEFAULT_AVATAR}
                alt={post.author?.fullname}
                className="w-10 h-10 rounded-full object-cover group-hover:opacity-90 transition-opacity"
                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
              />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:underline">
                  {post.author?.fullname}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(post.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </Link>
          </div>

          {/* Media / content */}
          {post.type === "image" && (
            <img src={post.mediaUrl} alt="Post" className="w-full object-cover max-h-[500px]" />
          )}
          {post.type === "video" && (
            <video controls className="w-full max-h-[500px] bg-black">
              <source src={post.mediaUrl} type="video/mp4" />
            </video>
          )}
          {post.type === "text" && (
            <p className="px-5 py-6 text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          )}

          <div className="p-4 space-y-4">
            {/* Caption */}
            {post.caption && (
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">{post.caption}</p>
            )}

            {/* Like + comment counts */}
            <div className="flex items-center gap-5 text-sm text-gray-500 dark:text-gray-400">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 transition-colors ${isLiked ? "text-red-500" : "hover:text-red-400"}`}
              >
                {isLiked ? <FaHeart /> : <FaRegHeart />}
                <span>{post.likes?.length ?? 0}</span>
              </button>
              <div className="flex items-center gap-1.5">
                <FaComment />
                <span>{post.comments?.length ?? 0}</span>
              </div>
            </div>

            {/* Comment input */}
            <div className="flex gap-2">
              <img
                src={loggedInUser?.avatar || DEFAULT_AVATAR}
                alt="me"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
              />
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleComment()}
                placeholder="Add a comment…"
                className="flex-1 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 border border-transparent focus:border-blue-400 dark:focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none text-sm transition-all"
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim() || submitting}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {submitting ? "…" : "Post"}
              </button>
            </div>

            {/* Comments list */}
            {post.comments?.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                {post.comments.map((c, i) => (
                  <div key={c._id || i} className="flex gap-2.5 items-start">
                    <img
                      src={c.user?.avatar || DEFAULT_AVATAR}
                      alt={c.user?.fullname}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                    />
                    <div className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">
                        {c.user?.fullname || "User"}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{c.text}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(c.createdAt).toLocaleString([], {
                          month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostView;
