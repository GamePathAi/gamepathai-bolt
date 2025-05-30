// Proxy para detecção de jogos GOG via IPC
export async function getGOGGames() {
  if (window?.electronAPI?.gameAPI?.detectGOGGames) {
    return await window.electronAPI.gameAPI.detectGOGGames();
  }
  return [];
}
