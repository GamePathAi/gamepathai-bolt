const {  } = require("");

const  = {
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
  },
  'Valorant': {
    platform: Platform.Riot,
    files: ['VALORANT.exe', 'VALORANT-Win64-Shipping.exe'],
    processName: 'VALORANT.exe'
  },
  'Grand Theft Auto V': {
    platform: Platform.Steam,
    files: ['GTA5.exe', 'PlayGTAV.exe'],
    processName: 'GTA5.exe'
  },
  'Apex Legends': {
    platform: Platform.Steam,
    files: ['r5apex.exe', 'EasyAntiCheat_launcher.exe'],
    processName: 'r5apex.exe'
  },
  'Call of Duty: Warzone': {
    platform: Platform.Battle,
    files: ['ModernWarfare.exe', 'cod.exe'],
    processName: 'ModernWarfare.exe'
  },
  'Minecraft': {
    platform: Platform.Other,
    files: ['Minecraft.exe', 'MinecraftLauncher.exe'],
    processName: 'Minecraft.exe'
  },
  'Overwatch 2': {
    platform: Platform.Battle,
    files: ['Overwatch.exe'],
    processName: 'Overwatch.exe'
  },
  'Dota 2': {
    platform: Platform.Steam,
    files: ['dota2.exe'],
    processName: 'dota2.exe'
  },
  'Rainbow Six Siege': {
    platform: Platform.Ubisoft,
    files: ['RainbowSix.exe', 'RainbowSix_BE.exe'],
    processName: 'RainbowSix.exe'
  },
  'Destiny 2': {
    platform: Platform.Steam,
    files: ['destiny2.exe'],
    processName: 'destiny2.exe'
  },
  'Elden Ring': {
    platform: Platform.Steam,
    files: ['eldenring.exe'],
    processName: 'eldenring.exe'
  },
  'World of Warcraft': {
    platform: Platform.Battle,
    files: ['Wow.exe', 'WowClassic.exe'],
    processName: 'Wow.exe'
  },
  'Diablo IV': {
    platform: Platform.Battle,
    files: ['Diablo IV.exe'],
    processName: 'Diablo IV.exe'
  },
  'Battlefield 2042': {
    platform: Platform.Origin,
    files: ['BF2042.exe'],
    processName: 'BF2042.exe'
  },
  'The Witcher 3': {
    platform: Platform.Steam,
    files: ['witcher3.exe'],
    processName: 'witcher3.exe'
  },
  'Rocket League': {
    platform: Platform.Epic,
    files: ['RocketLeague.exe'],
    processName: 'RocketLeague.exe'
  },
  'Rust': {
    platform: Platform.Steam,
    files: ['RustClient.exe'],
    processName: 'RustClient.exe'
  }
};

const  = {
  [Platform.Steam]: {
    windows: [
      'C:\\Program Files (x86)\\Steam\\steamapps\\common',
      'C:\\Program Files\\Steam\\steamapps\\common',
      'D:\\Steam\\steamapps\\common',
      'E:\\Steam\\steamapps\\common',
      'F:\\Steam\\steamapps\\common'
    ],
    linux: [
      '~/.local/share/Steam/steamapps/common',
      '~/.steam/steam/steamapps/common',
      '~/.steam/root/steamapps/common'
    ],
    mac: [
      '~/Library/Application Support/Steam/steamapps/common'
    ]
  },
  [Platform.Epic]: {
    windows: [
      'C:\\Program Files\\Epic Games',
      'C:\\Program Files (x86)\\Epic Games',
      'D:\\Epic Games',
      'E:\\Epic Games',
      'F:\\Epic Games'
    ],
    linux: [
      '~/.local/share/Epic',
      '~/.epic/store/games',
      '~/Games/Epic'
    ],
    mac: [
      '~/Library/Application Support/Epic/EpicGames'
    ]
  },
  [Platform.Riot]: {
    windows: [
      'C:\\Riot Games',
      'C:\\Program Files\\Riot Games',
      'C:\\Program Files (x86)\\Riot Games',
      'D:\\Riot Games',
      'E:\\Riot Games',
      'F:\\Riot Games'
    ],
    linux: [
      '~/.local/share/Riot Games',
      '~/.wine/drive_c/Riot Games',
      '~/Games/Riot Games'
    ],
    mac: [
      '/Applications/Riot Games',
      '~/Library/Application Support/Riot Games'
    ]
  },
  [Platform.Origin]: {
    windows: [
      'C:\\Program Files (x86)\\Origin Games',
      'C:\\Program Files\\Origin Games',
      'D:\\Origin Games',
      'E:\\Origin Games',
      'F:\\Origin Games'
    ],
    linux: [
      '~/.local/share/Origin Games',
      '~/Games/Origin'
    ],
    mac: [
      '~/Library/Application Support/Origin/Games'
    ]
  },
  [Platform.Battle]: {
    windows: [
      'C:\\Program Files (x86)\\Battle.net',
      'C:\\Program Files\\Battle.net',
      'D:\\Battle.net',
      'E:\\Battle.net',
      'F:\\Battle.net'
    ],
    linux: [
      '~/.local/share/Battle.net',
      '~/Games/Battle.net'
    ],
    mac: [
      '/Applications/Battle.net',
      '~/Library/Application Support/Battle.net'
    ]
  },
  [Platform.Ubisoft]: {
    windows: [
      'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games',
      'C:\\Program Files\\Ubisoft\\Ubisoft Game Launcher\\games',
      'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Connect\\games',
      'C:\\Program Files\\Ubisoft\\Ubisoft Connect\\games',
      'D:\\Ubisoft\\games',
      'E:\\Ubisoft\\games',
      'F:\\Ubisoft\\games'
    ],
    linux: [
      '~/.local/share/Ubisoft Connect/games',
      '~/Games/Ubisoft'
    ],
    mac: [
      '~/Library/Application Support/Ubisoft/Ubisoft Connect/games'
    ]
  },
  [Platform.Other]: {
    windows: [
      'C:\\Program Files (x86)\\',
      'C:\\Program Files\\',
      'D:\\Games\\',
      'E:\\Games\\',
      'F:\\Games\\'
    ],
    linux: [
      '~/Games',
      '~/.local/share/games'
    ],
    mac: [
      '/Applications',
      '~/Applications'
    ]
  }
};