// Mock implementations for web environment
const mockGetSteamGames = async () => {
  return [
    {
      id: 'steam-730',
      name: 'Counter-Strike 2',
      platform: 'Steam',
      process_name: 'cs2.exe',
      installPath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike 2',
      size: 35 * 1024,
      icon_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg',
      optimized: false
    },
    {
      id: 'steam-1091500',
      name: 'Cyberpunk 2077',
      platform: 'Steam',
      process_name: 'Cyberpunk2077.exe',
      installPath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Cyberpunk 2077',
      size: 100 * 1024,
      icon_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg',
      optimized: false
    },
    {
      id: 'steam-1245620',
      name: 'Elden Ring',
      platform: 'Steam',
      process_name: 'eldenring.exe',
      installPath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\ELDEN RING',
      size: 60 * 1024,
      icon_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg',
      optimized: false
    },
    {
      id: 'steam-1086940',
      name: 'Baldur\'s Gate 3',
      platform: 'Steam',
      process_name: 'bg3.exe',
      installPath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Baldurs Gate 3',
      size: 122 * 1024,
      icon_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg',
      optimized: false
    },
    {
      id: 'steam-1174180',
      name: 'Red Dead Redemption 2',
      platform: 'Steam',
      process_name: 'RDR2.exe',
      installPath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Red Dead Redemption 2',
      size: 150 * 1024,
      icon_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg',
      optimized: false
    }
  ];
};

const mockGetEpicGames = async () => {
  return [
    {
      id: 'epic-fortnite',
      name: 'Fortnite',
      platform: 'Epic',
      process_name: 'FortniteClient-Win64-Shipping.exe',
      installPath: 'C:\\Program Files\\Epic Games\\Fortnite',
      size: 26 * 1024,
      icon_url: 'https://cdn2.unrealengine.com/24br-s24-egs-launcher-productart-1920x1080-1920x1080-ec04a20bd189.jpg',
      optimized: false
    },
    {
      id: 'epic-rocket_league',
      name: 'Rocket League',
      platform: 'Epic',
      process_name: 'RocketLeague.exe',
      installPath: 'C:\\Program Files\\Epic Games\\rocketleague',
      size: 20 * 1024,
      icon_url: 'https://cdn1.epicgames.com/offer/9773aa1aa54f4f7b80e44bef04986cea/EGS_RocketLeague_PsyonixLLC_S2_1200x1600-c010a13661fb46c1a9f8d097da909b6e',
      optimized: false
    },
    {
      id: 'epic-gta5',
      name: 'Grand Theft Auto V',
      platform: 'Epic',
      process_name: 'GTA5.exe',
      installPath: 'C:\\Program Files\\Epic Games\\GTAV',
      size: 105 * 1024,
      icon_url: 'https://cdn1.epicgames.com/0584d2013f0149a791e7b9bad0eec102/offer/GTAV_EGS_Artwork_1200x1600_Portrait%20Store%20Banner-1200x1600-382243057711adf80322ed2aeea42191.jpg',
      optimized: false
    }
  ];
};

const mockGetXboxGames = async () => {
  return [
    {
      id: 'xbox-forza',
      name: 'Forza Horizon 5',
      platform: 'Xbox',
      process_name: 'ForzaHorizon5.exe',
      installPath: 'C:\\Program Files\\WindowsApps\\Microsoft.ForzaHorizon5',
      size: 110 * 1024,
      icon_url: 'https://store-images.s-microsoft.com/image/apps.16285.14545862226628914.552c1c1a-6c9f-4a94-a83a-8d3165b95a7c.2a1f8a68-5aad-4a18-a8e7-f3a935f60a7c',
      optimized: false
    },
    {
      id: 'xbox-halo_infinite',
      name: 'Halo Infinite',
      platform: 'Xbox',
      process_name: 'HaloInfinite.exe',
      installPath: 'C:\\Program Files\\WindowsApps\\Microsoft.HaloInfinite',
      size: 70 * 1024,
      icon_url: 'https://store-images.s-microsoft.com/image/apps.65119.14038107331740138.6a496b44-b8e5-4a5e-a632-db2fea135ae6.be70f297-0d61-4650-b5ac-ef9c4c6d0a2a',
      optimized: false
    },
    {
      id: 'xbox-sea_of_thieves',
      name: 'Sea of Thieves',
      platform: 'Xbox',
      process_name: 'SoTGame.exe',
      installPath: 'C:\\Program Files\\WindowsApps\\Microsoft.SeaofThieves',
      size: 50 * 1024,
      icon_url: 'https://store-images.s-microsoft.com/image/apps.64156.14154249287303114.f5c1ce97-0d91-4e2f-a4f9-81d9c5c4c4c4.6e367dbe-c3c6-4a3a-b7a0-2a60d585a0e5',
      optimized: false
    },
    {
      id: 'xbox-callofduty',
      name: 'Call of Duty',
      platform: 'Xbox',
      process_name: 'ModernWarfare.exe',
      installPath: 'C:\\Program Files\\WindowsApps\\Microsoft.CallofDuty',
      size: 120 * 1024,
      icon_url: 'https://store-images.s-microsoft.com/image/apps.52300.13809253608509332.c7976381-1225-4b5a-9f1e-5f3d97c20809.be6d75e9-e8c5-4de9-9b6c-8a0b2f79e56a',
      optimized: false
    }
  ];
};

const mockGetOriginGames = async () => {
  return [
    {
      id: 'origin-battlefield',
      name: 'Battlefield 2042',
      platform: 'Origin',
      process_name: 'BF2042.exe',
      installPath: 'C:\\Program Files (x86)\\Origin Games\\Battlefield 2042',
      size: 45 * 1024,
      icon_url: 'https://media.contentapi.ea.com/content/dam/battlefield/battlefield-2042/images/2021/04/k-1920x1080-featured-image.jpg.adapt.crop16x9.1023w.jpg',
      optimized: false
    },
    {
      id: 'origin-apex_legends',
      name: 'Apex Legends',
      platform: 'Origin',
      process_name: 'r5apex.exe',
      installPath: 'C:\\Program Files (x86)\\Origin Games\\Apex',
      size: 80 * 1024,
      icon_url: 'https://media.contentapi.ea.com/content/dam/apex-legends/images/2019/01/apex-featured-image-16x9.jpg.adapt.crop16x9.1023w.jpg',
      optimized: false
    },
    {
      id: 'origin-the_sims_4',
      name: 'The Sims 4',
      platform: 'Origin',
      process_name: 'TS4_x64.exe',
      installPath: 'C:\\Program Files (x86)\\Origin Games\\The Sims 4',
      size: 30 * 1024,
      icon_url: 'https://media.contentapi.ea.com/content/dam/eacom/SIMS/brand-refresh-assets/images/2019/07/ts4-featured-image-base-refresh.png.adapt.crop16x9.1023w.png',
      optimized: false
    }
  ];
};

const mockGetBattleNetGames = async () => {
  return [
    {
      id: 'battlenet-overwatch2',
      name: 'Overwatch 2',
      platform: 'Battle.net',
      process_name: 'Overwatch.exe',
      installPath: 'C:\\Program Files (x86)\\Battle.net\\Games\\Overwatch',
      size: 50 * 1024,
      icon_url: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt0c8f82b1d7a78e4e/622906a991f4232f0085d3cc/Masthead_Overwatch2_Logo.png',
      optimized: false
    },
    {
      id: 'battlenet-wow',
      name: 'World of Warcraft',
      platform: 'Battle.net',
      process_name: 'Wow.exe',
      installPath: 'C:\\Program Files (x86)\\Battle.net\\Games\\World of Warcraft',
      size: 100 * 1024,
      icon_url: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/bltd6b49a2d33e715e1/62f5dcd2c1d5855da1673a4e/WoW_Masthead_Logo.png',
      optimized: false
    },
    {
      id: 'battlenet-diablo4',
      name: 'Diablo IV',
      platform: 'Battle.net',
      process_name: 'Diablo IV.exe',
      installPath: 'C:\\Program Files (x86)\\Battle.net\\Games\\Diablo IV',
      size: 90 * 1024,
      icon_url: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt7c7f5dec2a3fd536/63c5c7f3a8b0b4111ff3fe7c/Diablo_Masthead_Logo.png',
      optimized: false
    }
  ];
};

const mockGetGOGGames = async () => {
  return [
    {
      id: 'gog-witcher3',
      name: 'The Witcher 3: Wild Hunt',
      platform: 'GOG',
      process_name: 'witcher3.exe',
      installPath: 'C:\\GOG Games\\The Witcher 3 Wild Hunt',
      size: 50 * 1024,
      icon_url: 'https://images.gog-statics.com/d7c3b13c54d632a185c6a271f1e2f5fc768dd4a01308118b8a3fb1a2edc7e306_product_card_v2_mobile_slider_639.jpg',
      optimized: false
    },
    {
      id: 'gog-cyberpunk2077',
      name: 'Cyberpunk 2077',
      platform: 'GOG',
      process_name: 'Cyberpunk2077.exe',
      installPath: 'C:\\GOG Games\\Cyberpunk 2077',
      size: 70 * 1024,
      icon_url: 'https://images.gog-statics.com/c75e674590b8947542c809924df30bbef2190341163dd08668e243c266be70c5_product_card_v2_mobile_slider_639.jpg',
      optimized: false
    }
  ];
};

const mockGetUplayGames = async () => {
  return [
    {
      id: 'uplay-assassinscreed',
      name: 'Assassin\'s Creed Valhalla',
      platform: 'Ubisoft Connect',
      process_name: 'ACValhalla.exe',
      installPath: 'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games\\Assassin\'s Creed Valhalla',
      size: 50 * 1024,
      icon_url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/449BBgnQKEMSfaKVmJ5sV3/e1077125021162ce2d59820739c316e7/ACV_keyart.jpg',
      optimized: false
    },
    {
      id: 'uplay-farcry6',
      name: 'Far Cry 6',
      platform: 'Ubisoft Connect',
      process_name: 'FarCry6.exe',
      installPath: 'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games\\Far Cry 6',
      size: 60 * 1024,
      icon_url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/7gxWyQXL6Wb4ViKGLlwOXI/a5432a5a1ad4e60a0068ed8ef63cdc3a/FC6_meta-image.jpg',
      optimized: false
    }
  ];
};

module.exports = { 
  mockGetSteamGames, 
  mockGetEpicGames, 
  mockGetXboxGames, 
  mockGetOriginGames, 
  mockGetBattleNetGames, 
  mockGetGOGGames, 
  mockGetUplayGames 
};

module.exports = {  mockGetSteamGames, mockGetEpicGames, mockGetXboxGames, mockGetOriginGames, mockGetBattleNetGames, mockGetGOGGames, mockGetUplayGames  }