import { useState, useRef } from "react";
import { X, Image, Video, Send } from "lucide-react";
import { createStatus } from "../../services/statusApi";
import { useSocketContext } from "../../context/SocketContext";
import toast from "react-hot-toast";

const StatusCreator = ({ isOpen, onClose }) => {
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(null);
  const [caption, setCaption]     = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { socket } = useSocketContext();

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const isVideo = selected.type.startsWith("video/");
    setMediaType(isVideo ? "video" : "image");
    setFile(selected);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error("Please select a photo or video"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("media", file);
      fd.append("caption", caption.trim());
      fd.append("type", mediaType);
      const newStatus = await createStatus(fd);
      if (socket) socket.emit("create-status", { status: newStatus });
      toast.success("Status posted!");
      handleClose();
    } catch (err) {
      toast.error(err?.message || "Failed to post status");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null); setPreview(null); setCaption(""); onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Status</h2>
          <button onClick={handleClose} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {!preview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 transition-colors"
            >
              <div className="flex gap-3"><Image size={28} /><Video size={28} /></div>
              <span className="text-sm font-medium">Tap to add photo or video</span>
            </button>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black">
              {mediaType === "video"
                ? <video src={preview} className="w-full max-h-64 object-contain" controls />
                : <img src={preview} alt="preview" className="w-full max-h-64 object-contain" />}
              <button type="button" onClick={() => { setFile(null); setPreview(null); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors">
                <X size={14} />
              </button>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />

          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            maxLength={200}
            className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 border border-transparent focus:border-blue-400 dark:focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none text-sm transition-all"
          />

          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white font-semibold text-sm transition-colors"
          >
            {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
            {uploading ? "Posting…" : "Post Status"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StatusCreator;
