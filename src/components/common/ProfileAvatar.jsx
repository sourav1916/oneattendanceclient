import React, { useState } from 'react';

export const getProfilePictureUrl = (profilePicture) => {
  if (!profilePicture || typeof profilePicture !== 'string') return null;
  const value = profilePicture.trim();
  if (!value) return null;
  return value;
};

export const getUserProfilePicture = (record) =>
  record?.profile_picture ||
  record?.profilePicture ||
  record?.user_profile_picture ||
  record?.employee_profile_picture ||
  record?.user?.profile_picture ||
  record?.employee?.profile_picture ||
  record?.employee?.user?.profile_picture ||
  record?.invited_by?.profile_picture ||
  null;

export default function ProfileAvatar({
  record,
  profilePicture,
  name = 'User',
  className,
  imgClassName = '',
  onClick,
  children,
}) {
  const [failed, setFailed] = useState(false);
  const src = getProfilePictureUrl(profilePicture || getUserProfilePicture(record));

  const interactiveClass = onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : '';

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        className={`${className} object-cover ${imgClassName} ${interactiveClass}`}
        onError={() => setFailed(true)}
        onClick={onClick}
      />
    );
  }

  return (
      <div 
        className={`${className} ${interactiveClass}`} 
        onClick={onClick}
      >
        {children}
      </div>
  );
}
