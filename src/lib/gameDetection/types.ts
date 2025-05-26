// Platform enum for both CommonJS and ES6
export const Platform = {
  Steam: 'Steam',
  Epic: 'Epic',
  Riot: 'Riot',
  Origin: 'Origin',
  Battle: 'Battle.net',
  Ubisoft: 'Ubisoft Connect',
  GOG: 'GOG',
  Xbox: 'Xbox',
  Other: 'Other'
};

// Game info interface
export interface GameInfo {
  id: string;
  name: string;
  platform: string;
  executablePath: string;
  process_name: string;
  installPath: string;
  size: number;
  icon_url: string;
  optimized: boolean;
  last_played: Date | null;
}



