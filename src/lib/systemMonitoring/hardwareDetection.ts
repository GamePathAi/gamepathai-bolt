// Removendo import de isElectron e usando verificação inline

export async function detectHardware() {
  // Verificar se está no Electron diretamente
  const inElectron = typeof window !== 'undefined' && window.electronAPI;
  
  if (!inElectron) {
    console.log('Not in Electron environment - hardware detection unavailable');
    return null;
  }

  try {
    const hardware = await window.electronAPI.system.getHardwareInfo();
    return hardware;
  } catch (error) {
    console.error('Error detecting hardware:', error);
    return null;
  }
}
