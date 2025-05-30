// initGames.ts
export function initializeDefaultGames() {
  if (typeof window === 'undefined') return;
  
  const defaultGames = [
    {
      id: 'rdr2-steam',
      name: 'Red Dead Redemption 2',
      platform: 'Steam',
      executablePath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Red Dead Redemption 2\\RDR2.exe',
      installPath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Red Dead Redemption 2',
      isInstalled: true,
      coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg',
      lastPlayed: null,
      size: '150 GB'
    },
    {
      id: 'cod-mw3',
      name: 'Call of Duty: Modern Warfare III', 
      platform: 'Xbox Game Pass',
      executablePath: 'cod-mw3.exe',
      installPath: 'C:\\XboxGames\\Call of Duty Modern Warfare III',
      isInstalled: true,
      coverImage: 'https://www.callofduty.com/content/dam/atvi/callofduty/cod-touchui/mw3/home/reveal/new-mw3-reveal-meta.jpg',
      lastPlayed: null,
      size: '125 GB'
    }
  ];

  // Verificar se já existem jogos
  const existingGames = localStorage.getItem('games');
  if (!existingGames || JSON.parse(existingGames).length === 0) {
    const keys = ['games', 'installedGames', 'scannedGames', 'gameLibrary'];
    keys.forEach(key => {
      localStorage.setItem(key, JSON.stringify(defaultGames));
    });
    console.log('[initGames] ✅ Jogos padrão adicionados');
  }
}

// Auto-executar quando o DOM carregar
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', initializeDefaultGames);
}