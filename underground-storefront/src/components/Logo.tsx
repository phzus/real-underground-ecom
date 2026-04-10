
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Main Brand */}
      <div className="relative group">
        <img src="/logo.png" alt="Logo" className="max-w-82 rotate-8 object-contain" />
      </div>
    </div>
  );
};

export default Logo;