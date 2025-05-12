import { supabase } from './supabase';

interface DownloadOptions {
  platform: 'windows' | 'mac' | 'linux';
  version?: string;
  direct?: boolean;
}

// GitHub repository information
const REPO_OWNER = 'GamePathAi';
const REPO_NAME = 'gamepathai-bolt';
const DEFAULT_VERSION = 'v1.0.0'; // Use a specific version tag instead of "latest"

export async function downloadApp(options: DownloadOptions): Promise<{ success: boolean; url?: string; error?: string }> {
  const { platform, version = DEFAULT_VERSION, direct = false } = options;
  
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

    // Get the download URL
    const downloadUrl = getDownloadUrl(platform, version);

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

export function getDownloadUrl(platform: 'windows' | 'mac' | 'linux', version: string = DEFAULT_VERSION): string {
  const fileName = platform === 'windows' ? 'GamePathAI-Setup.exe' : 
                   platform === 'mac' ? 'GamePathAI.dmg' : 
                   'GamePathAI.AppImage';
  
  // Use GitHub releases URL format
  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${version}/${fileName}`;
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