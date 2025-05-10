export enum Platform {
  Steam = 'Steam',
  Epic = 'Epic',
  Riot = 'Riot'
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

export interface DetectionConfig {
  signatures: Record<string, GameSignature>;
  paths: Record<Platform, SearchPaths>;
}