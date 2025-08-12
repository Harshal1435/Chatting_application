// components/PostView.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { FaHeart, FaRegHeart, FaComment } from "react-icons/fa";
  const token = JSON.parse(localStorage.getItem('token'));
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PostView = () => {
  const { id } = useParams(); // post ID from URL
 
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState("");

  const fetchPost = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/post/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPost(res.data);
    } catch (err) {
      console.error("Failed to load post:", err);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const handleLike = async () => {
    try {
      await axios.put(`${BASE_URL}/api/post/${id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPost(); // Refresh after like
    } catch (err) {
      console.error("Like failed:", err);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    try {
      await axios.post(`${BASE_URL}/api/post/${id}/comment`, {
        text: commentText,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCommentText("");
      fetchPost();
    } catch (err) {
      console.error("Comment failed:", err);
    }
  };

  if (!post) return <div className="text-white p-4">Loading post...</div>;

  return (
    <div className="max-w-xl mx-auto mt-6 p-4 bg-[#1a1a1a] text-white rounded-xl shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <img
          src={post.author.avatar}
          alt={post.author.fullname}
          className="w-10 h-10 rounded-full object-cover"
        />
        <h2 className="font-semibold">{post.author.fullname}</h2>
      </div>

      {post.type === "image" && (
        <img src={post.mediaUrl} alt="Post" className="rounded-lg mb-4 w-full" />
      )}

      {post.type === "video" && (
        <video controls className="w-full mb-4 rounded-lg">
          <source src={post.mediaUrl} type="video/mp4" />
        </video>
      )}

      {post.type === "text" && (
        <p className="mb-4">{post.content}</p>
      )}

      {post.caption && (
        <p className="italic text-sm mb-4">{post.caption}</p>
      )}

      <div className="flex items-center gap-4 mb-4">
        <button onClick={handleLike}>
          {post.likes.some(user => user._id === post.author._id) ? (
            <FaHeart className="text-red-500 text-xl" />
          ) : (
            <FaRegHeart className="text-white text-xl" />
          )}
        </button>
        <span>{post.likes.length} likes</span>

        <FaComment className="text-white text-xl ml-4" />
        <span>{post.comments.length} comments</span>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="w-full p-2 rounded bg-[#333] text-white"
        />
        <button
          onClick={handleComment}
          className="mt-2 px-4 py-1 bg-blue-600 rounded hover:bg-blue-700"
        >
          Comment
        </button>
      </div>

      <div className="space-y-3">
        {post.comments.map((comment) => (
          <div key={comment._id} className="flex gap-2 items-start">
            <img
              src={comment.user.avatar}
              alt={comment.user.fullname}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <p className="font-semibold">{comment.user.fullname}</p>
              <p className="text-sm">{comment.text}</p>
              <p className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostView;
