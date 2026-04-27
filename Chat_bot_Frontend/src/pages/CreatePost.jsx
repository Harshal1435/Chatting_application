import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Image, Video, FileText, X, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Safe token getter — never throws
const getToken = () => {
  try {
    const raw = localStorage.getItem("token");
    if (!raw) return null;
    return raw.startsWith('"') ? JSON.parse(raw) : raw;
  } catch (_) {
    return null;
  }
};

const POST_TYPES = [
  { id: "text",  label: "Text",  icon: FileText },
  { id: "image", label: "Image", icon: Image },
  { id: "video", label: "Video", icon: Video },
];

const CreatePost = () => {
  const navigate = useNavigate();
  const [type, setType]         = useState("text");
  const [content, setContent]   = useState("");
  const [caption, setCaption]   = useState("");
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [loading, setLoading]   = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const clearFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (type !== "text" && !file) { toast.error("Please select a file"); return; }
    if (type === "text" && !content.trim()) { toast.error("Write something first"); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("type", type);
      fd.append("caption", caption.trim());
      if (type === "text") fd.append("content", content.trim());
      else if (file) fd.append("file", file);

      await axios.post(`${BASE_URL}/api/post/createPost`, fd, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Post created!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Create Post</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Type selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Post Type</label>
              <div className="flex gap-2">
                {POST_TYPES.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { setType(id); clearFile(); setContent(""); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      type === id
                        ? "bg-blue-500 text-white shadow-sm"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text content */}
            {type === "text" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  placeholder="What's on your mind?"
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 border border-transparent focus:border-blue-400 dark:focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none text-sm resize-none transition-all"
                />
              </div>
            )}

            {/* File upload */}
            {(type === "image" || type === "video") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {type === "image" ? "Photo" : "Video"}
                </label>
                {!preview ? (
                  <label className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                    {type === "image" ? <Image size={28} className="text-gray-400 mb-2" /> : <Video size={28} className="text-gray-400 mb-2" />}
                    <span className="text-sm text-gray-400 dark:text-gray-500">Click to upload {type}</span>
                    <input
                      type="file"
                      accept={type === "image" ? "image/*" : "video/*"}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative rounded-xl overflow-hidden bg-black">
                    {type === "image"
                      ? <img src={preview} alt="preview" className="w-full max-h-64 object-contain" />
                      : <video src={preview} controls className="w-full max-h-64" />}
                    <button
                      type="button"
                      onClick={clearFile}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Caption */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Caption <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption…"
                maxLength={200}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 border border-transparent focus:border-blue-400 dark:focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none text-sm transition-all"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white font-semibold text-sm transition-colors"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Posting…</>
                : "Create Post"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
