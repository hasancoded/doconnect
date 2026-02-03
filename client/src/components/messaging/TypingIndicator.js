// client/src/components/messaging/TypingIndicator.js
import React from "react";

const TypingIndicator = ({ userName }) => {
  return (
    <div className="flex justify-start">
      <div className="max-w-[70%]">
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1 px-1">
          {userName} is typing...
        </p>
      </div>
    </div>
  );
};

export default TypingIndicator;
