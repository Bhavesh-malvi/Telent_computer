import React from 'react';

const Avatar = ({ 
  src, 
  name, 
  size = 'md', 
  className = '', 
  onClick,
  showEditOverlay = false,
  editText = 'Edit'
}) => {
  // Size configurations
  const sizeConfig = {
    xs: { container: 'w-6 h-6', text: 'text-xs', border: 'border-2' },
    sm: { container: 'w-8 h-8', text: 'text-sm', border: 'border-2' },
    md: { container: 'w-12 h-12', text: 'text-base', border: 'border-2' },
    lg: { container: 'w-16 h-16', text: 'text-lg', border: 'border-3' },
    xl: { container: 'w-20 h-20', text: 'text-xl', border: 'border-4' },
    '2xl': { container: 'w-24 h-24', text: 'text-2xl', border: 'border-4' },
    '3xl': { container: 'w-32 h-32', text: 'text-3xl', border: 'border-4' }
  };

  const config = sizeConfig[size] || sizeConfig.md;

  // Generate background color based on name
  const getBackgroundColor = (name) => {
    if (!name) return 'bg-gray-400';
    
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-amber-500'
    ];
    
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get first letter of name
  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const avatarClasses = `
    ${config.container} 
    ${config.border} 
    border-blue-200 
    rounded-full 
    flex items-center justify-center 
    font-semibold text-white 
    ${config.text}
    ${getBackgroundColor(name)}
    ${onClick ? 'cursor-pointer hover:shadow-lg transition-all duration-200' : ''}
    ${className}
  `.trim();

  return (
    <div className="relative">
      <div 
        className={avatarClasses}
        onClick={onClick}
        style={{ 
          backgroundImage: src ? `url(${src})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {!src && (
          <span className="select-none">
            {getInitials(name)}
          </span>
        )}
      </div>
      
      {showEditOverlay && onClick && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          onClick={onClick}
        >
          <span className="text-white text-xs font-medium">{editText}</span>
        </div>
      )}
    </div>
  );
};

export default Avatar;
