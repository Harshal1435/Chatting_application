"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Reply,
} from "lucide-react";
import { useSocketContext } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthProvider";
import axios from "axios";

const StatusViewer = ({ status, onClose, currentUser }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setPaused] = useState(false);
  const [userStatuses, setUserStatuses] = useState([status]);

  const { socket } = useSocketContext();
  const { authUser } = useAuth();
  const baseurl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const DURATION = 5000;
  const videoRef = useRef(null);

  useEffect(() => {
    fetchUserStatuses();
  }, [status?.user?._id || status?.userId?._id]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 100 / (DURATION / 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused]);

  const fetchUserStatuses = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const { data } = await axios.get(`${baseurl}/api/status`, {
        headers: {
          Authorization: `Bearer ${JSON.parse(token)}`,
        },
      });

      const allStatuses = Object.values(data).flat();

      const userOnly = allStatuses.filter(
        (s) =>
          s.user?._id === status?.user?._id ||
          s.user?._id === status?.userId?._id
      );

      setUserStatuses(userOnly);
    } catch (error) {
      console.error("❌ Failed to fetch statuses:", error.response?.data || error.message);
    }
  };

  const handleNext = () => {
    if (currentIndex < userStatuses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  const currentStatus = userStatuses[currentIndex];
  const isVideo =
    currentStatus?.media?.includes(".mp4") ||
    currentStatus?.media?.includes(".webm");

  const statusUser = currentStatus?.user || currentStatus?.userId || {};

  useEffect(() => {
    if (isVideo && videoRef.current) {
      isPaused ? videoRef.current.pause() : videoRef.current.play();
    }
  }, [isPaused, currentIndex]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-600">
            {statusUser?.avatar ? (
              <img
                src={statusUser.avatar}
                alt={statusUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                {statusUser?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="font-medium">{statusUser?.name}</p>
            <p className="text-sm text-gray-300">
              {new Date(currentStatus?.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
        >
          <X size={24} />
        </button>
      </div>

      {/* Progress Bars */}
      <div className="flex space-x-1 px-4 pb-2">
        {userStatuses.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden cursor-pointer"
            onClick={() => {
              setCurrentIndex(index);
              setProgress(0);
            }}
          >
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{
                width:
                  index < currentIndex
                    ? "100%"
                    : index === currentIndex
                    ? `${progress}%`
                    : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div
        className="flex-1 relative flex items-center justify-center"
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <div
          className="absolute left-0 top-0 w-1/3 h-full z-10 cursor-pointer"
          onClick={handlePrevious}
        />
        <div
          className="absolute right-0 top-0 w-1/3 h-full z-10 cursor-pointer"
          onClick={handleNext}
        />

        {isVideo ? (
          <video
            ref={videoRef}
            src={currentStatus?.media}
            className="max-w-full max-h-full object-contain"
            autoPlay
            muted
            onEnded={handleNext}
          />
        ) : (
          <img
            src={currentStatus?.media}
            alt="Status"
            className="max-w-full max-h-full object-contain"
          />
        )}

        {currentStatus?.caption && (
          <div className="absolute bottom-20 left-4 right-4 text-white">
            <p className="text-lg font-medium bg-black bg-opacity-50 p-3 rounded-lg">
              {currentStatus.caption}
            </p>
          </div>
        )}

        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        {currentIndex < userStatuses.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 flex items-center justify-between text-white">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Eye size={18} />
            <span className="text-sm">
              {currentStatus?.viewers?.length || 0}
            </span>
          </div>
        </div>

        {statusUser?._id !== currentUser?._id && (
          <div className="flex items-center space-x-3">
            <button className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full">
              <Heart size={20} />
            </button>
            <button className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full">
              <Reply size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusViewer;
