// Proxy para detecção de jogos Epic via IPC
export async function getEpicGames() {
  if (window?.electronAPI?.gameAPI?.detectEpicGames) {
    return await window.electronAPI.gameAPI.detectEpicGames();
  }
  return [];
}
