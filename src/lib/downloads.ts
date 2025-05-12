import { supabase } from './supabase';

interface DownloadOptions {
  platform: 'windows' | 'mac' | 'linux';
  version?: string;
  direct?: boolean;
}

// Base URL for downloads - using GitHub releases
const DOWNLOAD_BASE_URL = 'https://github.com/GamePathAi/gamepathai-bolt/releases/download';

export async function downloadApp(options: DownloadOptions): Promise<{ success: boolean; url?: string; error?: string }> {
  const { platform, version = 'latest', direct = false } = options;
  
  try {
    // Log download attempt
    try {
      await supabase
        .from('download_events')
        .insert({
          platform,
          version,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          direct
        });
    } catch (error) {
      console.warn('Failed to log download event:', error);
      // Continue with download even if logging fails
    }

    // Build download URL
    const fileName = platform === 'windows' ? 'GamePathAI-Setup.exe' : 
                     platform === 'mac' ? 'GamePathAI.dmg' : 
                     'GamePathAI.AppImage';
    
    const downloadUrl = `${DOWNLOAD_BASE_URL}/${version}/${fileName}`;

    // If direct download is requested, return the URL
    if (direct) {
      return { success: true, url: downloadUrl };
    }

    // Create an anchor element and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true };
  } catch (error) {
    console.error('Download error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to start download'
    };
  }
}

export function getDownloadUrl(platform: 'windows' | 'mac' | 'linux', version: string = 'latest'): string {
  const fileName = platform === 'windows' ? 'GamePathAI-Setup.exe' : 
                   platform === 'mac' ? 'GamePathAI.dmg' : 
                   'GamePathAI.AppImage';
  
  return `${DOWNLOAD_BASE_URL}/${version}/${fileName}`;
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