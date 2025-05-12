import { supabase } from './supabase';

interface DownloadOptions {
  platform: 'windows' | 'mac' | 'linux';
  version?: string;
  direct?: boolean;
}

// Mock download URLs since the actual GitHub repository doesn't have releases yet
const DOWNLOAD_URLS = {
  windows: 'https://example.com/downloads/GamePathAI-Setup.exe',
  mac: 'https://example.com/downloads/GamePathAI.dmg',
  linux: 'https://example.com/downloads/GamePathAI.AppImage'
};

export async function downloadApp(options: DownloadOptions): Promise<{ success: boolean; url?: string; error?: string }> {
  const { platform, version = 'latest', direct = false } = options;
  
  try {
    // Log download attempt
    try {
      await supabase.from('download_events').insert({
        platform,
        version,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        direct: direct
      });
    } catch (error) {
      console.warn('Failed to log download event:', error);
      // Continue with download even if logging fails
    }

    // Get the download URL
    const downloadUrl = getDownloadUrl(platform);

    // For direct downloads, just return the URL
    if (direct) {
      return { success: true, url: downloadUrl };
    }

    // For browser-initiated downloads, open in a new tab
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    
    return { success: true };
  } catch (error) {
    console.error('Download error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to start download'
    };
  }
}

export function getDownloadUrl(platform: 'windows' | 'mac' | 'linux'): string {
  return DOWNLOAD_URLS[platform];
}

export function detectOS(): 'windows' | 'mac' | 'linux' | 'unknown' {
  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (platform.includes('win') || userAgent.includes('windows')) {
    return 'windows';
  }
  
  if (platform.includes('mac') || userAgent.includes('macintosh') || userAgent.includes('darwin')) {
    return 'mac';
  }
  
  if (platform.includes('linux') || platform.includes('x11') || userAgent.includes('linux')) {
    return 'linux';
  }
  
  return 'unknown';
}