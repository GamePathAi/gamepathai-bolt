import { supabase } from './supabase';

interface DownloadOptions {
  platform: 'windows' | 'mac' | 'linux';
  version?: string;
  direct?: boolean;
}

// Base URL for downloads - using GitHub releases as a temporary CDN
const DOWNLOAD_BASE_URL = 'https://github.com/gamepath-ai/releases/download';

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

    // Otherwise, fetch the file and trigger download
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/octet-stream',
        'X-Client-Info': 'gamepath-ai-web'
      },
      mode: 'cors',
      credentials: 'omit'
    });

    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

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