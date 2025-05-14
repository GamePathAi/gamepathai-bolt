import { supabase } from '../supabase';

export interface VpnServer {
  id: string;
  name: string;
  location: string;
  country: string;
  ping: number;
  load: number;
  bandwidth: number;
  isPro: boolean;
}

export interface VpnConnectionStatus {
  isConnected: boolean;
  server?: VpnServer;
  connectionTime?: Date;
  ip?: string;
  metrics?: {
    download: number;
    upload: number;
    latency: number;
    uptime: string;
  };
}

class VpnManager {
  private static instance: VpnManager;
  private status: VpnConnectionStatus = { isConnected: false };
  private servers: VpnServer[] = [];
  private isDesktopApp: boolean = false;
  private updateInterval: number | null = null;

  private constructor() {
    // Verificar se estamos no Electron
    this.isDesktopApp = !!window.electronAPI;
    this.initializeServers();
  }

  public static getInstance(): VpnManager {
    if (!VpnManager.instance) {
      VpnManager.instance = new VpnManager();
    }
    return VpnManager.instance;
  }

  private async initializeServers() {
    try {
      // Tentar carregar servidores do banco de dados
      const { data, error } = await supabase
        .from('vpn_servers')
        .select('*')
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        this.servers = data;
      } else {
        // Fallback para servidores predefinidos
        this.servers = this.getDefaultServers();
      }
    } catch (error) {
      console.error('Erro ao carregar servidores VPN:', error);
      this.servers = this.getDefaultServers();
    }
  }
  
  private getDefaultServers(): VpnServer[] {
    return [
      {
        id: 'auto',
        name: 'Auto (Melhor Localização)',
        location: 'Automático',
        country: 'Global',
        ping: 24,
        load: 30,
        bandwidth: 150,
        isPro: false
      },
      {
        id: 'us-east',
        name: 'US East',
        location: 'Nova York',
        country: 'Estados Unidos',
        ping: 86,
        load: 45,
        bandwidth: 120,
        isPro: false
      },
      {
        id: 'us-west',
        name: 'US West',
        location: 'Los Angeles',
        country: 'Estados Unidos',
        ping: 110,
        load: 40,
        bandwidth: 130,
        isPro: false
      },
      {
        id: 'eu-west',
        name: 'Europe West',
        location: 'Londres',
        country: 'Reino Unido',
        ping: 145,
        load: 35,
        bandwidth: 140,
        isPro: false
      },
      {
        id: 'eu-central',
        name: 'Europe Central',
        location: 'Frankfurt',
        country: 'Alemanha',
        ping: 160,
        load: 30,
        bandwidth: 145,
        isPro: false
      },
      {
        id: 'asia-east',
        name: 'Asia East',
        location: 'Tóquio',
        country: 'Japão',
        ping: 190,
        load: 25,
        bandwidth: 110,
        isPro: false
      },
      {
        id: 'asia-southeast',
        name: 'Asia Southeast',
        location: 'Singapura',
        country: 'Singapura',
        ping: 210,
        load: 20,
        bandwidth: 100,
        isPro: true
      },
      {
        id: 'au',
        name: 'Australia',
        location: 'Sydney',
        country: 'Austrália',
        ping: 250,
        load: 15,
        bandwidth: 95,
        isPro: true
      },
      {
        id: 'sa-east',
        name: 'South America East',
        location: 'São Paulo',
        country: 'Brasil',
        ping: 120,
        load: 30,
        bandwidth: 90,
        isPro: true
      }
    ];
  }

  public async connect(serverId: string): Promise<boolean> {
    try {
      // Verificar se o servidor existe
      const server = this.servers.find(s => s.id === serverId);
      if (!server) {
        throw new Error('Servidor VPN não encontrado');
      }
      
      // Verificar se é um servidor Pro
      if (server.isPro) {
        // Verificar se o usuário tem acesso Pro
        const hasPro = await this.checkProAccess();
        if (!hasPro) {
          throw new Error('Este servidor requer uma assinatura Pro');
        }
      }
      
      // Verificar se estamos no Electron
      if (this.isDesktopApp && window.electronAPI) {
        // Conectar via Electron
        console.log(`Conectando ao servidor VPN ${server.name} via Electron`);
        const result = await window.electronAPI.connectToVpn(server);
        
        if (!result.success) {
          throw new Error(result.error || 'Falha ao conectar à VPN');
        }
      } else {
        // Simulação para ambiente web
        console.log(`Simulando conexão ao servidor VPN ${server.name} (ambiente web)`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simular tempo de conexão
      }
      
      // Atualizar status
      this.status = {
        isConnected: true,
        server,
        connectionTime: new Date(),
        ip: this.generateRandomIp(),
        metrics: {
          download: 80 + Math.random() * 40,
          upload: 20 + Math.random() * 20,
          latency: server.ping,
          uptime: '00:00'
        }
      };
      
      // Iniciar monitoramento de métricas
      this.startMetricsUpdates();
      
      // Registrar conexão no banco de dados
      await this.logConnection(server);
      
      return true;
    } catch (error) {
      console.error('Erro ao conectar à VPN:', error);
      return false;
    }
  }
  
  public async disconnect(): Promise<boolean> {
    try {
      if (!this.status.isConnected) {
        return true; // Já desconectado
      }
      
      // Verificar se estamos no Electron
      if (this.isDesktopApp && window.electronAPI) {
        // Desconectar via Electron
        console.log('Desconectando da VPN via Electron');
        const result = await window.electronAPI.disconnectFromVpn();
        
        if (!result.success) {
          throw new Error(result.error || 'Falha ao desconectar da VPN');
        }
      } else {
        // Simulação para ambiente web
        console.log('Simulando desconexão da VPN (ambiente web)');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simular tempo de desconexão
      }
      
      // Parar monitoramento de métricas
      this.stopMetricsUpdates();
      
      // Registrar desconexão no banco de dados
      if (this.status.server) {
        await this.logDisconnection(this.status.server);
      }
      
      // Atualizar status
      this.status = { isConnected: false };
      
      return true;
    } catch (error) {
      console.error('Erro ao desconectar da VPN:', error);
      return false;
    }
  }
  
  private startMetricsUpdates() {
    // Parar atualizações existentes
    this.stopMetricsUpdates();
    
    // Iniciar novas atualizações
    this.updateInterval = window.setInterval(() => {
      if (!this.status.isConnected || !this.status.metrics) return;
      
      // Atualizar métricas
      const metrics = this.status.metrics;
      
      // Atualizar download/upload com pequenas variações
      metrics.download = Math.max(1, metrics.download + (Math.random() * 10 - 5));
      metrics.upload = Math.max(1, metrics.upload + (Math.random() * 6 - 3));
      
      // Atualizar latência com pequenas variações
      metrics.latency = Math.max(1, metrics.latency + (Math.random() * 4 - 2));
      
      // Atualizar tempo de atividade
      if (this.status.connectionTime) {
        const uptime = Math.floor((Date.now() - this.status.connectionTime.getTime()) / 1000);
        const minutes = Math.floor(uptime / 60);
        const seconds = uptime % 60;
        metrics.uptime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }, 2000);
  }
  
  private stopMetricsUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  private async checkProAccess(): Promise<boolean> {
    try {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      // Verificar se o usuário tem acesso Pro
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('is_pro')
        .eq('user_id', user.id)
        .single();
        
      if (error || !profile) return false;
      
      return !!profile.is_pro;
    } catch (error) {
      console.error('Erro ao verificar acesso Pro:', error);
      return false;
    }
  }
  
  private async logConnection(server: VpnServer): Promise<void> {
    try {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Registrar conexão
      await supabase
        .from('vpn_connections')
        .insert({
          user_id: user.id,
          server_id: server.id,
          connected_at: new Date().toISOString(),
          ip_address: this.status.ip,
          status: 'connected'
        });
    } catch (error) {
      console.error('Erro ao registrar conexão VPN:', error);
    }
  }
  
  private async logDisconnection(server: VpnServer): Promise<void> {
    try {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Buscar conexão ativa
      const { data: connection, error } = await supabase
        .from('vpn_connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('server_id', server.id)
        .eq('status', 'connected')
        .order('connected_at', { ascending: false })
        .limit(1)
        .single();
        
      if (error || !connection) {
        // Se não encontrar, criar um novo registro de desconexão
        await supabase
          .from('vpn_connections')
          .insert({
            user_id: user.id,
            server_id: server.id,
            connected_at: new Date(Date.now() - 60000).toISOString(), // 1 minuto atrás
            disconnected_at: new Date().toISOString(),
            status: 'disconnected'
          });
      } else {
        // Atualizar conexão existente
        await supabase
          .from('vpn_connections')
          .update({
            disconnected_at: new Date().toISOString(),
            status: 'disconnected'
          })
          .eq('id', connection.id);
      }
    } catch (error) {
      console.error('Erro ao registrar desconexão VPN:', error);
    }
  }
  
  private generateRandomIp(): string {
    // Gerar IP aleatório para simulação
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }
  
  public getServers(): VpnServer[] {
    return this.servers;
  }
  
  public getStatus(): VpnConnectionStatus {
    return this.status;
  }
  
  public async refreshServers(): Promise<VpnServer[]> {
    await this.initializeServers();
    return this.servers;
  }
}

export const vpnManager = VpnManager.getInstance();