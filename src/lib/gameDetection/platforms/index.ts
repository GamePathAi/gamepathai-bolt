import getSteamGames from './getSteamGames';
import getEpicGames from './getEpicGames';
import getXboxGames from './getXboxGames';
import getOriginGames from './getOriginGames';

// Export all platform-specific game detection functions
export {
  getSteamGames,
  getEpicGames,
  getXboxGames,
  getOriginGames
};

// Mock implementations for web environment
export const mockGetSteamGames = async () => {
  return [
    {
      id: 'cs2',
      name: 'Counter-Strike 2',
      platform: 'Steam',
      process_name: 'cs2.exe',
      install_path: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike 2',
      size: 35 * 1024,
      icon_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg',
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk 2077',
      platform: 'Steam',
      process_name: 'Cyberpunk2077.exe',
      install_path: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Cyberpunk 2077',
      size: 100 * 1024,
      icon_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg',
    }
  ];
};

export const mockGetEpicGames = async () => {
  return [
    {
      id: 'fortnite',
      name: 'Fortnite',
      platform: 'Epic',
      process_name: 'FortniteClient-Win64-Shipping.exe',
      install_path: 'C:\\Program Files\\Epic Games\\Fortnite',
      size: 26 * 1024,
      icon_url: 'https://cdn2.unrealengine.com/24br-s24-egs-launcher-productart-1920x1080-1920x1080-ec04a20bd189.jpg',
    }
  ];
};

export const mockGetXboxGames = async () => {
  return [
    {
      id: 'forza',
      name: 'Forza Horizon 5',
      platform: 'Xbox',
      process_name: 'ForzaHorizon5.exe',
      install_path: 'C:\\Program Files\\WindowsApps\\Microsoft.ForzaHorizon5',
      size: 110 * 1024,
      icon_url: 'https://store-images.s-microsoft.com/image/apps.16285.14545862226628914.552c1c1a-6c9f-4a94-a83a-8d3165b95a7c.2a1f8a68-5aad-4a18-a8e7-f3a935f60a7c',
    }
  ];
};

export const mockGetOriginGames = async () => {
  return [
    {
      id: 'battlefield',
      name: 'Battlefield 2042',
      platform: 'Origin',
      process_name: 'BF2042.exe',
      install_path: 'C:\\Program Files (x86)\\Origin Games\\Battlefield 2042',
      size: 45 * 1024,
      icon_url: 'https://media.contentapi.ea.com/content/dam/battlefield/battlefield-2042/images/2021/04/k-1920x1080-featured-image.jpg.adapt.crop16x9.1023w.jpg',
    }
  ];
};