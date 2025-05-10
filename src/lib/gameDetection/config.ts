import { Platform } from './types';

export const gameSignatures = {
  'Cyberpunk 2077': {
    platform: Platform.Steam,
    files: ['Cyberpunk2077.exe', 'RED4.dll'],
    processName: 'Cyberpunk2077.exe'
  },
  'League of Legends': {
    platform: Platform.Riot,
    files: ['LeagueClient.exe', 'League of Legends.exe'],
    processName: 'LeagueClient.exe'
  },
  'Counter-Strike 2': {
    platform: Platform.Steam,
    files: ['cs2.exe', 'steam_api64.dll'],
    processName: 'cs2.exe'
  },
  'Fortnite': {
    platform: Platform.Epic,
    files: ['FortniteClient-Win64-Shipping.exe'],
    processName: 'FortniteClient-Win64-Shipping.exe'
  }
};

export const searchPaths = {
  [Platform.Steam]: {
    windows: [
      'C:\\Program Files (x86)\\Steam\\steamapps\\common',
      'C:\\Program Files\\Steam\\steamapps\\common'
    ],
    linux: [
      '~/.local/share/Steam/steamapps/common',
      '~/.steam/steam/steamapps/common'
    ],
    mac: [
      '~/Library/Application Support/Steam/steamapps/common'
    ]
  },
  [Platform.Epic]: {
    windows: [
      'C:\\Program Files\\Epic Games',
      'C:\\Program Files (x86)\\Epic Games'
    ],
    linux: [
      '~/.local/share/Epic',
      '~/.epic/store/games'
    ],
    mac: [
      '~/Library/Application Support/Epic/EpicGames'
    ]
  },
  [Platform.Riot]: {
    windows: [
      'C:\\Riot Games',
      'C:\\Program Files\\Riot Games',
      'C:\\Program Files (x86)\\Riot Games'
    ],
    linux: [
      '~/.local/share/Riot Games',
      '~/.wine/drive_c/Riot Games'
    ],
    mac: [
      '/Applications/Riot Games'
    ]
  }
};