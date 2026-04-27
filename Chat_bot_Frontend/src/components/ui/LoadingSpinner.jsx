import React from "react";

const LoadingSpinner = ({ size = "medium", color = "primary" }) => {
  const sizeClasses = {
    small: "h-4 w-4 border-2",
    medium: "h-8 w-8 border-4",
    large: "h-12 w-12 border-4"
  };

  const colorClasses = {
    primary: "border-blue-500 border-t-transparent",
    secondary: "border-gray-500 border-t-transparent",
    white: "border-white border-t-transparent",
    dark: "border-gray-800 border-t-transparent"
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;