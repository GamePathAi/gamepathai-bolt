export enum Platform {
  Steam = 'Steam',
  Epic = 'Epic',
  Riot = 'Riot',
  Origin = 'Origin',
  Battle = 'Battle.net',
  Ubisoft = 'Ubisoft Connect',
  GOG = 'GOG',
  Xbox = 'Xbox',
  Other = 'Other'
}

export interface GameInfo {
  id: string;
  name: string;
  platform: string;
  installPath?: string;
  executablePath?: string;
  process_name?: string;
  icon_url?: string;
  last_played?: Date;
  size?: number;
  optimized?: boolean;
  status?: string;
  version?: string;
}

export interface DetectionResult {
  platform: string;
  games: GameInfo[];
  error?: string;
}

export interface DetectorOptions {
  useCache?: boolean;
  forceRefresh?: boolean;
  timeout?: number;
}