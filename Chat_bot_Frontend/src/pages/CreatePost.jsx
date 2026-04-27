import React, { useState } from "react";
import axios from "axios";

const CreatePost = () => {
  const [type, setType] = useState("text");
  const [content, setContent] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = JSON.parse(localStorage.getItem("token"));

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    if (selected) {
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("caption", caption);
      if (type === "text") {
        formData.append("content", content);
      } else if (file) {
        formData.append("file", file);
      }

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/post/createPost`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage("✅ Post created successfully!");
      setContent("");
      setCaption("");
      setFile(null);
      setPreview(null);
      setType("text");
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.error || "❌ Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-4">Create New Post</h2>

      {message && <p className="mb-4 text-sm text-center">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Post Type */}
        <div>
          <label className="block mb-1 font-medium">Post Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>

        {/* Text Content */}
        {type === "text" && (
          <div>
            <label className="block mb-1 font-medium">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              rows={4}
              placeholder="Write your post..."
              required
            />
          </div>
        )}

        {/* File Upload */}
        {(type === "image" || type === "video") && (
          <div>
            <label className="block mb-1 font-medium">Upload {type}</label>
            <input
              type="file"
              accept={type === "image" ? "image/*" : "video/*"}
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-700"
              required
            />
            {preview && (
              <div className="mt-3">
                {type === "image" ? (
                  <img src={preview} alt="Preview" className="h-40 object-cover rounded" />
                ) : (
                  <video controls src={preview} className="h-40 rounded" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Caption */}
        <div>
          <label className="block mb-1 font-medium">Caption (optional)</label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Add a caption..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full"
        >
          {loading ? "Posting..." : "Create Post"}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
