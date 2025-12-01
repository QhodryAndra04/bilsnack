import React from "react";

const StarIcon = ({ filled, size = "md", className }) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "#FFC633" : "none"}
      stroke={filled ? "#FFC633" : "#a1a1aa"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${sizeClasses[size]} ${className}`}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
};

const StarRating = ({ rating, size = "md", className }) => {
  const totalStars = 5;
  return (
    <div className={`flex items-center ${className}`}>
      {[...Array(totalStars)].map((_, index) => (
        <StarIcon key={index} filled={index < Math.round(rating)} size={size} />
      ))}
    </div>
  );
};

export default StarRating;
