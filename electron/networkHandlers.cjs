// electron/networkHandlers.cjs

const { ipcMain } = require('electron');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const dns = require('dns').promises;
const net = require('net');

function setupNetworkIPC() {
  // Ping handler with real ping command
  ipcMain.handle('ping', async (event, host, count = 4) => {
    try {
      const isWindows = process.platform === 'win32';
      const command = isWindows 
        ? `ping -n ${count} ${host}` 
        : `ping -c ${count} ${host}`;
      
      const { stdout } = await execPromise(command, { encoding: 'utf8' });
      
      // Parse ping results
      const times = [];
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        // Windows: time=XXms or time<1ms
        // Linux/Mac: time=XX.X ms
        let match = line.match(/time[<=](\d+\.?\d*)\s*ms/i);
        if (!match && isWindows) {
          // Try alternative Windows format
          match = line.match(/Average = (\d+)ms/i);
        }
        
        if (match) {
          times.push(parseFloat(match[1]));
        }
      }
      
      // If no times found but command succeeded, return a default
      if (times.length === 0 && stdout.includes('Reply from')) {
        times.push(1); // Assume <1ms
      }
      
      return times.length > 0 ? times : [-1];
    } catch (error) {
      console.error('Ping error:', error);
      // Try DNS lookup as fallback
      try {
        const start = Date.now();
        await dns.lookup(host);
        const end = Date.now();
        return [end - start];
      } catch {
        return [-1];
      }
    }
  });

  // Traceroute handler
  ipcMain.handle('traceroute', async (event, host) => {
    try {
      const command = process.platform === 'win32' 
        ? `tracert -h 10 ${host}` 
        : `traceroute -m 10 ${host}`;
      
      const { stdout } = await execPromise(command, { 
        encoding: 'utf8',
        timeout: 30000 // 30 seconds timeout
      });
      
      const hops = [];
      const lines = stdout.split('\n');
      
      // Simple parsing
      lines.forEach((line, index) => {
        if (line.trim() && index > 0) {
          const match = line.match(/(\d+)\s+.+\s+(\d+\.?\d*)\s*ms/);
          if (match) {
            hops.push({
              hop: parseInt(match[1]),
              ip: host,
              hostname: host,
              latency: parseFloat(match[2])
            });
          }
        }
      });
      
      return hops.length > 0 ? hops : [{
        hop: 1,
        ip: host,
        hostname: host,
        latency: 0
      }];
    } catch (error) {
      console.error('Traceroute error:', error);
      return [];
    }
  });

  // DNS servers handler
  ipcMain.handle('getDNSServers', async () => {
    try {
      if (process.platform === 'win32') {
        const { stdout } = await execPromise('nslookup example.com', { encoding: 'utf8' });
        const match = stdout.match(/Server:\s+(.+)/);
        if (match) {
          return [match[1].trim()];
        }
      }
      return ['8.8.8.8', '8.8.4.4'];
    } catch {
      return ['8.8.8.8', '8.8.4.4'];
    }
  });

  // Test TCP Port
  ipcMain.handle('testTCPPort', async (event, host, port, timeout = 1000) => {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let connected = false;

      socket.setTimeout(timeout);
      
      socket.on('connect', () => {
        connected = true;
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        resolve(false);
      });

      socket.connect(port, host);
    });
  });

  // Resolve hostname
  ipcMain.handle('resolveHostname', async (event, hostname) => {
    try {
      const result = await dns.lookup(hostname);
      return result.address;
    } catch {
      return null;
    }
  });

  console.log('✅ Network IPC handlers registered');
}

module.exports = { setupNetworkIPC };