// Proxy para detecção de jogos Uplay via IPC
export async function getUplayGames() {
  if (window?.electronAPI?.gameAPI?.detectUplayGames) {
    return await window.electronAPI.gameAPI.detectUplayGames();
  }
  return [];
}
