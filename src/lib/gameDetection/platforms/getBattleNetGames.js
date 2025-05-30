// Proxy para detecção de jogos Battle.net via IPC
export async function getBattleNetGames() {
  if (window?.electronAPI?.gameAPI?.detectBattleNetGames) {
    return await window.electronAPI.gameAPI.detectBattleNetGames();
  }
  return [];
}
