// Proxy para detecção de jogos Steam via IPC

/**
 * @returns {Promise<Array>} Lista de jogos Steam detectados
 */
export async function getSteamGames() {
  if (window?.electronAPI?.gameAPI?.detectSteamGames) {
    return await window.electronAPI.gameAPI.detectSteamGames();
  }
  return [];
}
