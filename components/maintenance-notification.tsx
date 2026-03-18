'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export function MaintenanceNotification() {
  useEffect(() => {
    // Show maintenance toast on component mount
    const toastId = toast.warning('🚧 Site Under Maintenance', {
      description:
        'This site is currently under maintenance and will be available again soon. Thank you for your patience!',
      duration: 8000, // Show for 8 seconds
      position: 'top-center',
    });

    return () => {
      // Cleanup function to dismiss toast if component unmounts
      if (toastId) {
        toast.dismiss(toastId);
      }
    };
  }, []);

  return null; // This component doesn't render anything visible
}
