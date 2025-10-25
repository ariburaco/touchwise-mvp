'use client';

import { useState, useEffect } from 'react';
import { 
  isMobile, 
  isTablet, 
  isDesktop,
  isIOS, 
  isAndroid,
  isMacOs,
  isWindows,
  deviceType,
  osName
} from 'react-device-detect';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  hasCamera: boolean;
  platform: string;
  deviceType: string;
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouch: false,
    hasCamera: false,
    platform: 'unknown',
    deviceType: 'desktop',
  });

  useEffect(() => {
    const checkDevice = async () => {
      // Check if running in browser
      if (typeof window === 'undefined') {
        return;
      }

      // Check for touch support
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Determine platform from react-device-detect
      let platform = 'unknown';
      if (isIOS) {
        platform = 'ios';
      } else if (isAndroid) {
        platform = 'android';
      } else if (isWindows) {
        platform = 'windows';
      } else if (isMacOs) {
        platform = 'mac';
      } else if (osName && osName.toLowerCase().includes('linux')) {
        platform = 'linux';
      }

      // Smart camera detection
      let hasCamera = false;
      try {
        // Check if mediaDevices API exists
        if (navigator.mediaDevices) {
          // Assume mobile and tablet devices have cameras
          if (isMobile || isTablet) {
            hasCamera = true;
          } else {
            // For desktop, try to check for camera devices
            try {
              const devices = await navigator.mediaDevices.enumerateDevices();
              hasCamera = devices.some(device => device.kind === 'videoinput');
            } catch (enumError) {
              // If enumeration fails but API exists, assume camera available
              hasCamera = !!navigator.mediaDevices.getUserMedia;
            }
          }
        } else {
          // Fallback: assume mobile devices have cameras
          hasCamera = isMobile || isTablet;
        }
      } catch (error) {
        // Final fallback
        hasCamera = isMobile || isTablet;
      }

      const result = {
        isMobile,
        isTablet,
        isDesktop,
        isTouch,
        hasCamera,
        platform,
        deviceType,
      };

      // Debug logging
      console.log('Device Detection Results (react-device-detect):', result);
      console.log('OS Name:', osName);
      console.log('MediaDevices available:', !!navigator.mediaDevices);

      setDeviceInfo(result);
    };

    checkDevice();
  }, []);

  return deviceInfo;
}

// Hook for checking if camera capture should be available
export function useCameraAvailable(): boolean {
  const { isMobile, isTablet, hasCamera, platform } = useDeviceDetection();
  
  console.log('Camera Available Check:', { isMobile, isTablet, hasCamera, platform });
  
  // Show camera option if device has camera capability and is mobile or tablet
  const isAvailable = hasCamera && (isMobile || isTablet);
  
  console.log('Camera button will show:', isAvailable);
  return isAvailable;
}