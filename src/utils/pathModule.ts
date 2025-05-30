export const getPathModule = () => {
  // Verificar cache
  if ((window as any).__CACHED_PATH_MODULE__) {
    return (window as any).__CACHED_PATH_MODULE__;
  }
  let pathModule: any;
  try {
    // Opção 1: Electron com require
    if (typeof (window as any).require === 'function') {
      pathModule = (window as any).require('path');
      console.log('[PATH] Using native Node.js path module');
    }
    // Opção 2: Electron com preload API
    else if ((window as any)?.api?.path) {
      pathModule = (window as any).api.path;
      console.log('[PATH] Using window.api.path module');
    }
    // Opção 3: Tauri
    else if ((window as any)?.__TAURI__?.path) {
      pathModule = (window as any).__TAURI__.path;
      console.log('[PATH] Using Tauri path module');
    }
    else {
      throw new Error('No native path module available');
    }
  } catch (e) {
    // FALLBACK que sempre funciona
    console.warn('[PATH] Using fallback path implementation');
    pathModule = {
      join: (...args: string[]) => {
        return args
          .filter(Boolean)
          .join('/')
          .replace(/[\\/]+/g, '/')
          .replace(/\/$/, '')
          .replace(/(.+)\/$/, '$1');
      },
      basename: (filepath: string, ext?: string) => {
        const base = filepath.split(/[\\/]/).pop() || '';
        if (ext && base.endsWith(ext)) {
          return base.slice(0, -ext.length);
        }
        return base;
      },
      dirname: (filepath: string) => {
        const parts = filepath.split(/[\\/]/);
        parts.pop();
        return parts.join('/') || '/';
      },
      resolve: (...paths: string[]) => {
        return paths.filter(Boolean).join('/').replace(/[\\/]+/g, '/');
      },
      extname: (filepath: string) => {
        const base = filepath.split(/[\\/]/).pop() || '';
        const lastDot = base.lastIndexOf('.');
        return lastDot > 0 ? base.slice(lastDot) : '';
      },
      sep: '/',
      delimiter: ';'
    };
  }
  // Cachear para reutilização
  (window as any).__CACHED_PATH_MODULE__ = pathModule;
  return pathModule;
};
