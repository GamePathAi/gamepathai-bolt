import { supabase } from './supabase';

interface DownloadOptions {
  platform: 'windows' | 'mac' | 'linux';
  version?: string;
  referralSource?: string;
  campaignId?: string;
  deviceType?: string;
}

// Production download URLs with proper code signing and checksums
const DOWNLOAD_URLS = {
  windows: 'https://cdn.gamepathai.com/releases/latest/GamePathAI-Setup.exe',
  mac: 'https://cdn.gamepathai.com/releases/latest/GamePathAI.dmg',
  linux: 'https://cdn.gamepathai.com/releases/latest/GamePathAI.AppImage'
};

export async function downloadApp(options: DownloadOptions): Promise<{ success: boolean; url?: string; error?: string }> {
  const { 
    platform, 
    version = 'latest',
    referralSource = 'direct',
    campaignId = '',
    deviceType = detectDeviceType()
  } = options;
  
  try {
    // Get the current user if logged in
    const { data: { user } } = await supabase.auth.getUser();
    
    // Log download attempt
    try {
      await supabase.from('download_events').insert({
        platform,
        version,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        user_id: user?.id || null,
        device_type: deviceType,
        installation_status: 'initiated',
        referral_source: referralSource,
        campaign_id: campaignId,
        app_version: version
      });
    } catch (error) {
      console.warn('Failed to log download event:', error);
    }

    // Get the download URL
    const downloadUrl = getDownloadUrl(platform);

    // Create a hidden iframe for download
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Create form for POST download request
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = downloadUrl;
    form.target = iframe.name;

    // Add CSRF token
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = '_csrf';
      csrfInput.value = csrfToken;
      form.appendChild(csrfInput);
    }

    // Add download parameters
    const params = {
      platform,
      version,
      timestamp: Date.now().toString(),
      checksum: true
    };

    Object.entries(params).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    // Submit form to initiate download
    document.body.appendChild(form);
    form.submit();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(iframe);
      document.body.removeChild(form);
    }, 1000);

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

function detectDeviceType(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return 'ios';
  }
  
  if (/windows phone/i.test(userAgent)) {
    return 'windows_phone';
  }
  
  if (/tablet|ipad/i.test(userAgent) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android/i.test(userAgent)) {
    return 'mobile';
  }
  
  return 'desktop';
}

export async function updateInstallationStatus(downloadId: string, status: 'completed' | 'failed' | 'cancelled'): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('download_events')
      .update({ installation_status: status })
      .eq('id', downloadId);
      
    return !error;
  } catch (error) {
    console.error('Failed to update installation status:', error);
    return false;
  }
}

export async function getDownloadStats(days: number = 30): Promise<any> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('download_events')
      .select('platform, device_type, installation_status, created_at')
      .gte('created_at', startDate.toISOString());
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Failed to get download stats:', error);
    return [];
  }
}