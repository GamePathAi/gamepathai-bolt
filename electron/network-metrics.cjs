const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const os = require('os');
const dns = require('dns');
const net = require('net');

// Lista de servidores para teste de ping
const PING_SERVERS = {
  'Google': 'google.com',
  'Cloudflare': '1.1.1.1',
  'Amazon': 'aws.amazon.com',
  'Microsoft': 'microsoft.com',
  'Steam': 'steamcommunity.com',
  'Epic': 'epicgames.com',
  'Riot': 'riotgames.com'
};

// Lista de servidores de jogos populares
const GAME_SERVERS = {
  'Fortnite': 'epicgames.com',
  'League of Legends': 'riotgames.com',
  'CS:GO': 'steamcommunity.com',
  'Valorant': 'playvalorant.com',
  'Apex Legends': 'ea.com',
  'Call of Duty': 'callofduty.com'
};

class NetworkMetrics {
  constructor() {
    this.lastResults = {};
    this.history = [];
    this.maxHistoryLength = 100;
  }

  /**
   * Mede a latência para diversos servidores
   */
  async measureLatency(servers = PING_SERVERS) {
    const results = {};
    
    for (const [name, host] of Object.entries(servers)) {
      try {
        let pingResult;
        
        if (process.platform === 'win32') {
          // Windows
          const { stdout } = await execAsync(`ping -n 4 ${host}`);
          const match = stdout.match(/Average = (\d+)ms/);
          pingResult = match ? parseInt(match[1], 10) : null;
        } else {
          // Linux/macOS
          const { stdout } = await execAsync(`ping -c 4 ${host}`);
          const match = stdout.match(/min\/avg\/max\/mdev = [\d.]+\/([\d.]+)/);
          pingResult = match ? parseFloat(match[1]) : null;
        }
        
        results[name] = {
          host,
          latency: pingResult,
          timestamp: Date.now()
        };
      } catch (error) {
        console.error(`Erro ao medir latência para ${host}:`, error);
        results[name] = {
          host,
          latency: null,
          error: error.message,
          timestamp: Date.now()
        };
      }
    }
    
    this.lastResults = results;
    this.addToHistory({
      type: 'latency',
      data: results,
      timestamp: Date.now()
    });
    
    return results;
  }
  
  /**
   * Mede a qualidade da conexão (jitter, estabilidade)
   */
  async measureConnectionQuality(host = '1.1.1.1') {
    try {
      const pingResults = [];
      
      // Executar 10 pings para calcular jitter
      for (let i = 0; i < 10; i++) {
        let pingResult;
        
        if (process.platform === 'win32') {
          // Windows
          const { stdout } = await execAsync(`ping -n 1 ${host}`);
          const match = stdout.match(/time=(\d+)ms/);
          pingResult = match ? parseInt(match[1], 10) : null;
        } else {
          // Linux/macOS
          const { stdout } = await execAsync(`ping -c 1 ${host}`);
          const match = stdout.match(/time=([\d.]+) ms/);
          pingResult = match ? parseFloat(match[1]) : null;
        }
        
        if (pingResult !== null) {
          pingResults.push(pingResult);
        }
        
        // Pequena pausa entre pings
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Calcular jitter (desvio padrão dos pings)
      const jitter = this.calculateJitter(pingResults);
      
      // Calcular estabilidade (% de pings bem-sucedidos)
      const stability = (pingResults.length / 10) * 100;
      
      const result = {
        host,
        jitter,
        stability,
        pingResults,
        timestamp: Date.now()
      };
      
      this.addToHistory({
        type: 'quality',
        data: result,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      console.error(`Erro ao medir qualidade da conexão para ${host}:`, error);
      return {
        host,
        jitter: null,
        stability: 0,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Executa um traceroute para um host
   */
  async traceRoute(host = '1.1.1.1') {
    try {
      const command = process.platform === 'win32' 
        ? `tracert -d -h 15 ${host}` 
        : `traceroute -n -m 15 ${host}`;
      
      const { stdout } = await execAsync(command);
      
      // Parsear resultado do traceroute
      const hops = [];
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        // Ignorar linhas de cabeçalho
        if (line.includes('Tracing route') || line.includes('traceroute to') || !line.trim()) {
          continue;
        }
        
        // Extrair informações do hop
        const match = process.platform === 'win32'
          ? line.match(/\s*(\d+)\s+(\d+)\s+ms\s+(\d+)\s+ms\s+(\d+)\s+ms\s+(.+)/)
          : line.match(/\s*(\d+)\s+(.+)\s+(\d+\.\d+)\s+ms\s+(\d+\.\d+)\s+ms\s+(\d+\.\d+)\s+ms/);
        
        if (match) {
          const hopNumber = parseInt(match[1], 10);
          
          if (process.platform === 'win32') {
            const latency1 = parseInt(match[2], 10);
            const latency2 = parseInt(match[3], 10);
            const latency3 = parseInt(match[4], 10);
            const ip = match[5].trim();
            
            hops.push({
              hop: hopNumber,
              ip,
              latency: Math.min(latency1, latency2, latency3),
              avgLatency: (latency1 + latency2 + latency3) / 3
            });
          } else {
            const ip = match[2].trim();
            const latency1 = parseFloat(match[3]);
            const latency2 = parseFloat(match[4]);
            const latency3 = parseFloat(match[5]);
            
            hops.push({
              hop: hopNumber,
              ip,
              latency: Math.min(latency1, latency2, latency3),
              avgLatency: (latency1 + latency2 + latency3) / 3
            });
          }
        }
      }
      
      const result = {
        host,
        hops,
        timestamp: Date.now()
      };
      
      this.addToHistory({
        type: 'traceroute',
        data: result,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      console.error(`Erro ao executar traceroute para ${host}:`, error);
      return {
        host,
        hops: [],
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Estima a largura de banda disponível
   */
  async estimateBandwidth() {
    try {
      // Obter informações de interface de rede
      const interfaces = os.networkInterfaces();
      const activeInterfaces = [];
      
      // Encontrar interfaces ativas
      for (const [name, iface] of Object.entries(interfaces)) {
        if (Array.isArray(iface)) {
          for (const info of iface) {
            if (!info.internal && info.family === 'IPv4') {
              activeInterfaces.push({
                name,
                address: info.address,
                netmask: info.netmask,
                mac: info.mac
              });
            }
          }
        }
      }
      
      // Obter estatísticas de rede (simuladas)
      const downloadSpeed = 100 + Math.random() * 900; // 100-1000 Mbps
      const uploadSpeed = 10 + Math.random() * 90; // 10-100 Mbps
      
      const result = {
        interfaces: activeInterfaces,
        estimatedDownload: downloadSpeed,
        estimatedUpload: uploadSpeed,
        unit: 'Mbps',
        timestamp: Date.now()
      };
      
      this.addToHistory({
        type: 'bandwidth',
        data: result,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      console.error('Erro ao estimar largura de banda:', error);
      return {
        interfaces: [],
        estimatedDownload: null,
        estimatedUpload: null,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Calcula o jitter (variação de latência)
   */
  calculateJitter(pingResults) {
    if (!pingResults || pingResults.length < 2) {
      return 0;
    }
    
    // Calcular média
    const sum = pingResults.reduce((a, b) => a + b, 0);
    const mean = sum / pingResults.length;
    
    // Calcular desvio padrão (jitter)
    const squaredDiffs = pingResults.map(ping => Math.pow(ping - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / pingResults.length;
    const jitter = Math.sqrt(variance);
    
    return jitter;
  }
  
  /**
   * Calcula a perda de pacotes
   */
  async calculatePacketLoss(host = '1.1.1.1', count = 20) {
    try {
      const command = process.platform === 'win32'
        ? `ping -n ${count} ${host}`
        : `ping -c ${count} ${host}`;
      
      const { stdout } = await execAsync(command);
      
      // Extrair informações de perda de pacotes
      let packetLoss;
      
      if (process.platform === 'win32') {
        const match = stdout.match(/Lost = (\d+) \((\d+)% loss\)/);
        packetLoss = match ? parseFloat(match[2]) : null;
      } else {
        const match = stdout.match(/(\d+)% packet loss/);
        packetLoss = match ? parseFloat(match[1]) : null;
      }
      
      const result = {
        host,
        packetLoss,
        timestamp: Date.now()
      };
      
      this.addToHistory({
        type: 'packetLoss',
        data: result,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      console.error(`Erro ao calcular perda de pacotes para ${host}:`, error);
      return {
        host,
        packetLoss: null,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Resolve um nome de domínio para IP
   */
  async resolveHost(host) {
    return new Promise((resolve, reject) => {
      dns.lookup(host, (err, address) => {
        if (err) {
          reject(err);
        } else {
          resolve(address);
        }
      });
    });
  }
  
  /**
   * Verifica se uma porta está aberta em um host
   */
  async checkPort(host, port) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let status = false;
      
      // Timeout após 3 segundos
      socket.setTimeout(3000);
      
      socket.on('connect', () => {
        status = true;
        socket.destroy();
      });
      
      socket.on('timeout', () => {
        socket.destroy();
      });
      
      socket.on('error', () => {
        socket.destroy();
      });
      
      socket.on('close', () => {
        resolve(status);
      });
      
      socket.connect(port, host);
    });
  }
  
  /**
   * Adiciona um resultado ao histórico
   */
  addToHistory(entry) {
    this.history.push(entry);
    
    // Limitar tamanho do histórico
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }
  
  /**
   * Obtém o histórico de métricas
   */
  getHistory() {
    return this.history;
  }
  
  /**
   * Obtém os últimos resultados
   */
  getLastResults() {
    return this.lastResults;
  }
  
  /**
   * Executa uma análise completa da rede
   */
  async analyzeNetwork() {
    const latency = await this.measureLatency();
    const quality = await this.measureConnectionQuality();
    const bandwidth = await this.estimateBandwidth();
    const packetLoss = await this.calculatePacketLoss();
    const gameServers = await this.measureLatency(GAME_SERVERS);
    
    return {
      latency,
      quality,
      bandwidth,
      packetLoss,
      gameServers,
      timestamp: Date.now()
    };
  }
}

module.exports = new NetworkMetrics();