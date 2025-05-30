// Proxy para detecção de jogos Origin via IPC
export async function getOriginGames() {
  if (window?.electronAPI?.gameAPI?.detectOriginGames) {
    return await window.electronAPI.gameAPI.detectOriginGames();
  }
  return [];
}
