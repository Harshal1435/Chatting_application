import { useState, useRef, useEffect } from "react";
import { X, Send, Camera, Smile, Pencil } from "lucide-react";
import { useSocketContext } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthProvider";
import axios from "axios";

const StatusCreator = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const fileInputRef = useRef(null);
  const captionInputRef = useRef(null);

  const { socket } = useSocketContext();
  const { authUser } = useAuth();

  const baseurl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (showCaptionInput && captionInputRef.current) {
      captionInputRef.current.focus();
    }
  }, [showCaptionInput]);

  const resetForm = () => {
    setSelectedFile(null);
    setCaption("");
    setPreview(null);
    setShowCaptionInput(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleCreateStatus = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("media", selectedFile);
      formData.append("type", selectedFile.type.startsWith("video") ? "video" : "image");
      if (caption) formData.append("caption", caption);

      const token = JSON.parse(localStorage.getItem("token"));
      if (!token) throw new Error("No token found");

      const { data: result } = await axios.post(`${baseurl}/api/status`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      socket?.emit("create-status", { status: result });
      resetForm();
      onClose();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload status");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative w-full h-full max-h-screen flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 z-10">
          <button 
            onClick={onClose}
            className="text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={24} />
          </button>
          <button 
            onClick={handleCreateStatus}
            disabled={isUploading}
            className="text-white font-medium px-4 py-1 rounded-full bg-green-500 hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {isUploading ? "Sending..." : "Send"}
          </button>
        </div>

        {/* Status Preview */}
        {preview ? (
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            {selectedFile?.type.startsWith("image/") ? (
              <img
                src={preview}
                alt="Status preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                src={preview}
                className="w-full h-full object-contain"
                controls
                autoPlay
              />
            )}

            {/* Caption Input */}
            {showCaptionInput && (
              <div className="absolute bottom-20 left-0 right-0 px-4">
                <div className="relative">
                  <input
                    ref={captionInputRef}
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    className="w-full bg-black/50 text-white p-3 rounded-full border border-white/30 focus:outline-none focus:border-white pl-10 pr-4 transition-all"
                  />
                  <Smile className="absolute left-3 top-3 text-white" size={20} />
                </div>
              </div>
            )}

            {/* Bottom Controls */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <Camera className="text-white" size={24} />
              </button>
              
              <button
                onClick={() => setShowCaptionInput(!showCaptionInput)}
                className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <Pencil className="text-white" size={24} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                <Camera className="text-white" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white">Share a photo or video</h2>
              <p className="text-gray-300">Photos and videos will disappear after 24 hours</p>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
              >
                Select from gallery
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusCreator;