import React, { useState, useEffect } from 'react';
import { Staff } from '../types';
import { getStaffImageUrl, STAFF_IMAGE_PLACEHOLDER, getInitials } from '../utils/staffPhoto';

interface StaffAvatarProps {
  staff: Staff;
  sizeClassName?: string;
  avatarBgClassName?: string;
  ringClassName?: string;
  showOnlineStatus?: boolean;
  textSizeClassName?: string;
}

export const StaffAvatar: React.FC<StaffAvatarProps> = ({
  staff,
  sizeClassName = 'w-14 h-14 md:w-16 md:h-16',
  avatarBgClassName = 'bg-gradient-to-tr from-indigo-500 via-indigo-600 to-indigo-700 text-white',
  ringClassName = 'ring-2 ring-indigo-500/30',
  showOnlineStatus = false,
  textSizeClassName = 'text-base md:text-lg',
}) => {
  const staffId = staff?.staff_id || staff?.ID || '';
  const primaryUrl = getStaffImageUrl(staffId);

  // Print staff_id and generated image URL to browser console before rendering
  console.log(`staff_id = ${staffId}\n\ngenerated_url =\n${primaryUrl}`);

  const [currentSrc, setCurrentSrc] = useState<string>(primaryUrl);
  const [useInitialsFallback, setUseInitialsFallback] = useState<boolean>(false);

  useEffect(() => {
    const id = staff?.staff_id || staff?.ID || '';
    const imgUrl = getStaffImageUrl(id);
    setCurrentSrc(imgUrl);
    setUseInitialsFallback(false);
  }, [staff?.staff_id, staff?.ID]);

  const handleImageError = () => {
    // Print failure message as requested
    console.log(`Image failed:\n${currentSrc}`);

    if (currentSrc !== STAFF_IMAGE_PLACEHOLDER) {
      // Step 1: Automatic fallback to SYNCROZZ placeholder image if primary image fails
      setCurrentSrc(STAFF_IMAGE_PLACEHOLDER);
    } else {
      // Step 2: Fallback to initials if placeholder image is also unreachable
      setUseInitialsFallback(true);
    }
  };

  const initials = getInitials(staff?.Nama || '');

  return (
    <div className="relative shrink-0">
      <div
        className={`${sizeClassName} rounded-full overflow-hidden flex items-center justify-center font-black ${textSizeClassName} border-2 border-white shadow-md ${avatarBgClassName} ${ringClassName} transition-transform duration-200 group-hover:scale-105`}
      >
        {!useInitialsFallback && currentSrc ? (
          <img
            src={currentSrc}
            alt={staff?.Nama || 'Gambar Staf'}
            referrerPolicy="no-referrer"
            onError={handleImageError}
            className="w-full h-full object-cover rounded-full transition-opacity"
          />
        ) : (
          <span className="select-none tracking-wider">{initials}</span>
        )}
      </div>

      {showOnlineStatus && (
        <span
          className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white bg-slate-400"
        />
      )}
    </div>
  );
};

