import React, { useState } from 'react';

const API_BASE_URL = 'https://api-attendance.onesaas.in';

export const getProfilePictureUrl = (profilePicture) => {
  if (!profilePicture || typeof profilePicture !== 'string') return null;
  const value = profilePicture.trim();
  if (!value) return null;
  return value.startsWith('http') ? value : `${API_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
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
  children,
}) {
  const [failed, setFailed] = useState(false);
  const src = getProfilePictureUrl(profilePicture || getUserProfilePicture(record));

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        className={`${className} object-cover ${imgClassName}`}
        onError={() => setFailed(true)}
      />
    );
  }

  return <div className={className}>{children}</div>;
}
