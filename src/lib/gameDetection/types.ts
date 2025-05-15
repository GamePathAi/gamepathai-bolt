export enum Platform {
  Steam = 'Steam',
  Epic = 'Epic',
  Riot = 'Riot',
  Origin = 'Origin',
  Battle = 'Battle.net',
  Ubisoft = 'Ubisoft Connect',
  GOG = 'GOG',
  Other = 'Other'
}

export interface GameInfo {
  id?: string;
  name: string;
  platform: string;
  process_name: string;
  install_path: string;
  icon_url?: string;
  last_played?: Date;
  size?: number;
  optimized?: boolean;
  status?: string;
  version?: string;
  executablePath?: string;
}

export interface GameSignature {
  platform: Platform;
  files: string[];
  processName: string;
}

export interface SearchPaths {
  windows: string[];
  linux: string[];
  mac: string[];
}