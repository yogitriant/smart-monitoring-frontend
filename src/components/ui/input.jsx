// src/components/ui/input.jsx
import React from "react";

export const Input = ({ type = "text", ...props }) => {
  return (
    <input
      type={type}
      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      {...props}
    />
  );
};
