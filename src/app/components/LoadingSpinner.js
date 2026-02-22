import React from "react";

const LoadingSpinner = ({ size = "medium", color = "accent", fullScreen = false }) => {
  const sizeClasses = {
    small: "h-4 w-4 border-2",
    medium: "h-8 w-8 border-3",
    large: "h-12 w-12 border-4",
  };

  const colorClasses = {
    accent: "border-accent",
    blue: "border-blue-600",
    white: "border-white",
    gray: "border-gray-600",
  };

  const spinner = (
    <div
      className={`animate-spin rounded-full border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`}
      role="status"
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center p-4">
      {spinner}
    </div>
  );
};

export default LoadingSpinner;