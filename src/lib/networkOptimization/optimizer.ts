import { supabase } from '../supabase';

interface NetworkMetrics {
  latency: number;
  jitter: number;
  packetLoss: number;
  bandwidth: number;
  routeHops: any[];
  timestamp: number;
}

interface Route {
  id: string;
  nodes: string[];
  latency: number;
  bandwidth: number;
  load: number;
  reliability: number;
}

interface OptimizationResult {
  selectedRoute: Route;
  predictedLatency: number;
  confidenceScore: number;
  recommendations: string[];
}

class NetworkOptimizer {
  private static instance: NetworkOptimizer;
  private isOptimizing: boolean = false;
  private currentRoute: Route | null = null;
  private metricsBuffer: NetworkMetrics[] = [];
  private readonly bufferSize: number = 100;
  private readonly updateInterval: number = 5000; // 5 segundos
  private isConnected: boolean = false;

  private constructor() {
    this.startMetricsCollection();
  }

  public static getInstance(): NetworkOptimizer {
    if (!NetworkOptimizer.instance) {
      NetworkOptimizer.instance = new NetworkOptimizer();
    }
    return NetworkOptimizer.instance;
  }

  private startMetricsCollection() {
    setInterval(() => {
      if (this.isOptimizing) {
        this.collectMetrics();
      }
    }, this.updateInterval);
  }

  private async collectMetrics(): Promise<void> {
    // Verificar se estamos no Electron
    if (window.electronAPI) {
      try {
        const metrics = await window.electronAPI.measureNetworkPerformance();
        this.metricsBuffer.push({
          latency: metrics.latency || 0,
          jitter: metrics.jitter || 0,
          packetLoss: metrics.packetLoss || 0,
          bandwidth: metrics.bandwidth || 0,
          routeHops: metrics.routeHops || [],
          timestamp: Date.now()
        });
        
        if (this.metricsBuffer.length >= this.bufferSize) {
          await this.flushMetricsToDatabase();
        }
      } catch (error) {
        console.error('Erro ao coletar métricas de rede:', error);
      }
    } else {
      // Versão web - métricas simuladas
      const metrics: NetworkMetrics = {
        latency: this.simulateLatency(),
        jitter: this.simulateJitter(),
        packetLoss: this.simulatePacketLoss(),
        bandwidth: this.simulateBandwidth(),
        routeHops: this.simulateRouteHops(),
        timestamp: Date.now()
      };

      this.metricsBuffer.push(metrics);
      if (this.metricsBuffer.length >= this.bufferSize) {
        await this.flushMetricsToDatabase();
      }
    }
  }

  private async flushMetricsToDatabase(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('Usuário não autenticado, métricas não serão salvas');
        this.metricsBuffer = [];
        return;
      }

      // Preparar dados para inserção
      const metricsToInsert = this.metricsBuffer.map(metric => ({
        user_id: user.id,
        latency: metric.latency,
        jitter: metric.jitter,
        packet_loss: metric.packetLoss,
        bandwidth: metric.bandwidth,
        route_hops: metric.routeHops,
        timestamp: new Date(metric.timestamp).toISOString()
      }));

      const { error } = await supabase
        .from('network_metrics')
        .insert(metricsToInsert);

      if (error) throw error;
      this.metricsBuffer = [];
    } catch (error) {
      console.error('Erro ao salvar métricas de rede:', error);
    }
  }

  public async optimizeRoute(): Promise<OptimizationResult> {
    this.isOptimizing = true;

    try {
      // Obter rotas disponíveis
      const routes = await this.getAvailableRoutes();
      
      // Analisar condições atuais da rede
      const currentMetrics = await this.analyzeNetworkConditions();
      
      // Prever desempenho para cada rota
      const predictions = await this.predictRoutePerformance(routes, currentMetrics);
      
      // Selecionar rota ideal
      const optimalRoute = this.selectOptimalRoute(predictions);
      
      // Aplicar otimização
      await this.applyRouteOptimization(optimalRoute);
      
      // Gerar recomendações
      const recommendations = this.generateRecommendations(optimalRoute, currentMetrics);

      this.currentRoute = optimalRoute;
      this.isConnected = true;

      return {
        selectedRoute: optimalRoute,
        predictedLatency: predictions[optimalRoute.id].latency,
        confidenceScore: predictions[optimalRoute.id].confidence,
        recommendations
      };
    } catch (error) {
      console.error('Erro ao otimizar rota:', error);
      throw error;
    }
  }
  
  public async disconnectRoute(): Promise<boolean> {
    if (!this.isConnected) return true;
    
    try {
      // Verificar se estamos no Electron
      if (window.electronAPI) {
        await window.electronAPI.disconnectFromRoute();
      }
      
      this.isConnected = false;
      this.currentRoute = null;
      return true;
    } catch (error) {
      console.error('Erro ao desconectar rota:', error);
      return false;
    }
  }

  private async getAvailableRoutes(): Promise<Route[]> {
    try {
      // Verificar se estamos no Electron
      if (window.electronAPI) {
        const routes = await window.electronAPI.getAvailableRoutes();
        return routes;
      }
      
      // Fallback para web - buscar do banco de dados
      const { data, error } = await supabase
        .from('network_routes')
        .select('*')
        .order('reliability', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar rotas:', error);
      
      // Retornar rotas simuladas em caso de erro
      return [
        {
          id: 'auto',
          nodes: ['auto-node-1', 'auto-node-2'],
          latency: 24,
          bandwidth: 150,
          load: 0.3,
          reliability: 99.9
        },
        {
          id: 'us-east',
          nodes: ['us-east-node-1'],
          latency: 42,
          bandwidth: 120,
          load: 0.5,
          reliability: 98.5
        },
        {
          id: 'eu-west',
          nodes: ['eu-west-node-1'],
          latency: 28,
          bandwidth: 140,
          load: 0.4,
          reliability: 99.4
        }
      ];
    }
  }

  private async analyzeNetworkConditions(): Promise<NetworkMetrics> {
    // Verificar se estamos no Electron
    if (window.electronAPI) {
      try {
        const metrics = await window.electronAPI.measureNetworkPerformance();
        return {
          latency: metrics.latency || 0,
          jitter: metrics.jitter || 0,
          packetLoss: metrics.packetLoss || 0,
          bandwidth: metrics.bandwidth || 0,
          routeHops: metrics.routeHops || [],
          timestamp: Date.now()
        };
      } catch (error) {
        console.error('Erro ao analisar condições de rede:', error);
      }
    }
    
    // Fallback para métricas simuladas
    return {
      latency: this.simulateLatency(),
      jitter: this.simulateJitter(),
      packetLoss: this.simulatePacketLoss(),
      bandwidth: this.simulateBandwidth(),
      routeHops: this.simulateRouteHops(),
      timestamp: Date.now()
    };
  }

  private async predictRoutePerformance(routes: Route[], currentMetrics: NetworkMetrics): Promise<Record<string, any>> {
    const predictions: Record<string, any> = {};
    
    for (const route of routes) {
      predictions[route.id] = {
        latency: this.predictLatency(route, currentMetrics),
        bandwidth: this.predictBandwidth(route, currentMetrics),
        reliability: this.predictReliability(route, currentMetrics),
        confidence: this.calculateConfidence(route, currentMetrics)
      };
    }
    
    return predictions;
  }

  private selectOptimalRoute(predictions: Record<string, any>): Route {
    // Implementar lógica de seleção de rota com base nas previsões
    // Neste exemplo, selecionamos a rota com menor latência prevista
    
    // Obter todas as rotas
    const routes = Object.keys(predictions);
    
    // Ordenar por latência (menor primeiro)
    routes.sort((a, b) => predictions[a].latency - predictions[b].latency);
    
    // Retornar a rota com menor latência
    const selectedRouteId = routes[0];
    
    // Buscar a rota completa
    const selectedRoute = this.getRouteById(selectedRouteId);
    
    return selectedRoute;
  }

  private getRouteById(routeId: string): Route {
    // Implementação simplificada - em um app real, buscaria do banco de dados
    return {
      id: routeId,
      nodes: [`${routeId}-node-1`, `${routeId}-node-2`],
      latency: 24,
      bandwidth: 150,
      load: 0.3,
      reliability: 99.9
    };
  }

  private async applyRouteOptimization(route: Route): Promise<void> {
    // Verificar se estamos no Electron
    if (window.electronAPI) {
      try {
        await window.electronAPI.connectToRoute(route);
        console.log(`Conectado à rota ${route.id}`);
      } catch (error) {
        console.error(`Erro ao conectar à rota ${route.id}:`, error);
        throw error;
      }
    } else {
      console.log(`Simulando conexão à rota ${route.id} (ambiente web)`);
    }
  }

  private generateRecommendations(route: Route, metrics: NetworkMetrics): string[] {
    const recommendations: string[] = [];
    
    if (metrics.latency > 50) {
      recommendations.push('Considere usar uma localização de servidor mais próxima');
    }
    
    if (metrics.packetLoss > 0.1) {
      recommendations.push('Problemas de estabilidade de rede detectados - verifique sua conexão local');
    }
    
    if (metrics.bandwidth < 10) {
      recommendations.push('Baixa largura de banda detectada - otimize as configurações do jogo');
    }
    
    return recommendations;
  }

  // Métodos de simulação para ambiente web
  private simulateLatency(): number {
    return Math.floor(Math.random() * 50) + 10; // 10-60ms
  }

  private simulateJitter(): number {
    return Math.random() * 5; // 0-5ms
  }

  private simulatePacketLoss(): number {
    return Math.random() * 0.5; // 0-0.5%
  }

  private simulateBandwidth(): number {
    return Math.floor(Math.random() * 100) + 50; // 50-150 Mbps
  }

  private simulateRouteHops(): any[] {
    const numHops = Math.floor(Math.random() * 5) + 3; // 3-8 hops
    const hops = [];
    
    for (let i = 1; i <= numHops; i++) {
      hops.push({
        ip: `192.168.${i}.1`,
        latency: Math.floor(Math.random() * 20) + 5, // 5-25ms
        location: `Hop ${i}`
      });
    }
    
    return hops;
  }

  // Métodos de previsão
  private predictLatency(route: Route, metrics: NetworkMetrics): number {
    // Implementação simplificada - em um app real, usaria ML
    return route.latency * (1 + Math.random() * 0.2 - 0.1); // ±10%
  }

  private predictBandwidth(route: Route, metrics: NetworkMetrics): number {
    // Implementação simplificada
    return route.bandwidth * (1 + Math.random() * 0.2 - 0.1); // ±10%
  }

  private predictReliability(route: Route, metrics: NetworkMetrics): number {
    // Implementação simplificada
    return route.reliability * (1 - metrics.packetLoss / 100);
  }

  private calculateConfidence(route: Route, metrics: NetworkMetrics): number {
    // Implementação simplificada
    return 0.7 + Math.random() * 0.2; // 70-90%
  }
  
  // Método para obter métricas atuais
  public async getMetrics(): Promise<any> {
    return {
      isConnected: this.isConnected,
      currentRoute: this.currentRoute,
      latency: this.isConnected ? (this.currentRoute?.latency || 0) : 0,
      bandwidth: this.isConnected ? (this.currentRoute?.bandwidth || 0) : 0,
      reliability: this.isConnected ? (this.currentRoute?.reliability || 0) : 0
    };
  }
}

export const networkOptimizer = NetworkOptimizer.getInstance();