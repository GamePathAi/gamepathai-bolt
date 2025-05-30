// Proxy para detecção de jogos Xbox via IPC

/**
 * @returns {Promise<Array>} Lista de jogos Xbox detectados
 */
export async function getXboxGames() {
  if (window?.electronAPI?.gameAPI?.detectXboxGames) {
    return await window.electronAPI.gameAPI.detectXboxGames();
  }
  return [];
}
