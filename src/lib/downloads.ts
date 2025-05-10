import { supabase } from './supabase';

const DOWNLOAD_URLS = {
  windows: 'https://downloads.gamepath.ai/releases/latest/GamePathAI-Setup.exe',
  mac: 'https://downloads.gamepath.ai/releases/latest/GamePathAI.dmg',
  ios: 'https://apps.apple.com/app/gamepath-ai/id1234567890',
  android: 'https://play.google.com/store/apps/details?id=ai.gamepath.app'
};

export async function downloadApp(platform: 'windows' | 'mac' | 'ios' | 'android') {
  try {
    // Log download attempt
    await supabase.from('download_events').insert({
      platform,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    });

    // For mobile apps, redirect to store
    if (platform === 'ios' || platform === 'android') {
      window.location.href = DOWNLOAD_URLS[platform];
      return;
    }

    // For desktop apps, trigger download
    const link = document.createElement('a');
    link.href = DOWNLOAD_URLS[platform];
    link.download = platform === 'windows' ? 'GamePathAI-Setup.exe' : 'GamePathAI.dmg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error('Download error:', error);
    throw new Error('Failed to start download');
  }
}