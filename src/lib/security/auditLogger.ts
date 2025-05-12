import { supabase } from '../supabase';

export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_COMPLETE = 'password_reset_complete',
  SIGNUP = 'signup',
  EMAIL_VERIFICATION = 'email_verification',
  
  // Permission events
  PERMISSION_CHANGE = 'permission_change',
  ROLE_ASSIGNMENT = 'role_assignment',
  
  // Data access events
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  PROFILE_UPDATE = 'profile_update',
  PAYMENT_INFO_ACCESS = 'payment_info_access',
  
  // Subscription events
  SUBSCRIPTION_CHANGE = 'subscription_change',
  PAYMENT_METHOD_CHANGE = 'payment_method_change',
  
  // System events
  SYSTEM_SETTING_CHANGE = 'system_setting_change',
  FEATURE_FLAG_CHANGE = 'feature_flag_change',
  
  // Security events
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  IP_BLOCKED = 'ip_blocked'
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum AuditStatus {
  UNRESOLVED = 'unresolved',
  RESOLVED = 'resolved',
  IGNORED = 'ignored'
}

interface AuditLogOptions {
  userId?: string;
  eventType: AuditEventType;
  eventData?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  severity?: AuditSeverity;
  status?: AuditStatus;
}

class AuditLogger {
  private static instance: AuditLogger;

  private constructor() {}

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  public async log(options: AuditLogOptions): Promise<void> {
    try {
      const {
        userId,
        eventType,
        eventData = {},
        ipAddress = this.getClientIp(),
        userAgent = this.getUserAgent(),
        geolocation = {},
        severity = AuditSeverity.INFO,
        status = AuditStatus.UNRESOLVED
      } = options;

      // Add timestamp to event data
      const enrichedEventData = {
        ...eventData,
        timestamp: new Date().toISOString()
      };

      // Insert audit log
      const { error } = await supabase
        .from('security_audit_logs')
        .insert({
          user_id: userId,
          event_type: eventType,
          event_data: enrichedEventData,
          ip_address: ipAddress,
          user_agent: userAgent,
          geolocation: geolocation,
          severity: severity,
          status: status
        });

      if (error) {
        console.error('Failed to log security audit event:', error);
      }

      // For critical events, take immediate action
      if (severity === AuditSeverity.CRITICAL) {
        await this.handleCriticalEvent(userId, eventType, enrichedEventData);
      }
    } catch (error) {
      console.error('Error in audit logging:', error);
    }
  }

  private async handleCriticalEvent(
    userId: string | undefined,
    eventType: AuditEventType,
    eventData: Record<string, any>
  ): Promise<void> {
    // Implement critical event handling logic
    // For example, lock account, notify admin, etc.
    console.warn('Critical security event detected:', { userId, eventType, eventData });
    
    // If it's a login failure, check for brute force attempts
    if (eventType === AuditEventType.LOGIN_FAILURE && userId) {
      await this.checkBruteForceAttempts(userId);
    }
  }

  private async checkBruteForceAttempts(userId: string): Promise<void> {
    try {
      // Count recent failed login attempts
      const { count, error } = await supabase
        .from('security_audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('event_type', AuditEventType.LOGIN_FAILURE)
        .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()); // Last 15 minutes

      if (error) throw error;

      // If more than 5 failed attempts in 15 minutes, lock the account
      if (count && count >= 5) {
        // In a real implementation, this would lock the user account
        console.warn(`User ${userId} account should be temporarily locked due to multiple failed login attempts`);
        
        // Log account lock event
        await this.log({
          userId,
          eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
          eventData: {
            reason: 'Multiple failed login attempts',
            action: 'Account temporarily locked',
            failedAttempts: count
          },
          severity: AuditSeverity.ERROR,
          status: AuditStatus.RESOLVED
        });
      }
    } catch (error) {
      console.error('Error checking brute force attempts:', error);
    }
  }

  private getClientIp(): string {
    // In a real implementation, this would get the client IP
    // For now, return a placeholder
    return '0.0.0.0';
  }

  private getUserAgent(): string {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent;
    }
    return 'Unknown';
  }

  public async getAuditLogs(
    userId?: string,
    eventTypes?: AuditEventType[],
    severity?: AuditSeverity,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (eventTypes && eventTypes.length > 0) {
        query = query.in('event_type', eventTypes);
      }

      if (severity) {
        query = query.eq('severity', severity);
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }
}

export const auditLogger = AuditLogger.getInstance();