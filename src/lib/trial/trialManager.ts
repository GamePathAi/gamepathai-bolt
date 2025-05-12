import { supabase } from '../supabase';
import { auditLogger, AuditEventType, AuditSeverity } from '../security/auditLogger';

export enum TrialStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CONVERTED = 'converted'
}

export enum PricingPlan {
  FREE = 'free',
  PLAYER = 'player',
  COOP = 'coop',
  ALLIANCE = 'alliance'
}

export interface TrialExtension {
  days: number;
  reason: string;
  grantedAt: string;
  grantedBy?: string;
}

interface TrialInfo {
  status: TrialStatus;
  startDate: Date;
  endDate: Date;
  daysLeft: number;
  extensions: TrialExtension[];
  conversionDate?: Date;
  pricingPlan?: PricingPlan;
}

class TrialManager {
  private static instance: TrialManager;

  private constructor() {}

  public static getInstance(): TrialManager {
    if (!TrialManager.instance) {
      TrialManager.instance = new TrialManager();
    }
    return TrialManager.instance;
  }

  public async getTrialInfo(userId?: string): Promise<TrialInfo | null> {
    try {
      // If no userId provided, get current user
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        userId = user.id;
      }

      // Get user profile
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('trial_started_at, trial_end_date, trial_status, conversion_date, pricing_plan, trial_extensions')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (!profile) return null;

      const now = new Date();
      const startDate = new Date(profile.trial_started_at);
      const endDate = new Date(profile.trial_end_date);
      
      // Calculate days left
      const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      
      // Parse extensions
      const extensions = profile.trial_extensions || [];

      return {
        status: profile.trial_status as TrialStatus,
        startDate,
        endDate,
        daysLeft,
        extensions,
        conversionDate: profile.conversion_date ? new Date(profile.conversion_date) : undefined,
        pricingPlan: profile.pricing_plan as PricingPlan
      };
    } catch (error) {
      console.error('Error getting trial info:', error);
      return null;
    }
  }

  public async extendTrial(userId: string, days: number, reason: string): Promise<boolean> {
    try {
      // Get current trial info
      const trialInfo = await this.getTrialInfo(userId);
      if (!trialInfo) return false;

      // Calculate new end date
      const newEndDate = new Date(trialInfo.endDate);
      newEndDate.setDate(newEndDate.getDate() + days);

      // Create extension record
      const extension: TrialExtension = {
        days,
        reason,
        grantedAt: new Date().toISOString()
      };

      // Update user profile
      const { error } = await supabase
        .from('user_profiles')
        .update({
          trial_end_date: newEndDate.toISOString(),
          trial_status: TrialStatus.ACTIVE,
          trial_extensions: [...trialInfo.extensions, extension],
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Log the extension
      await auditLogger.log({
        userId,
        eventType: AuditEventType.SYSTEM_SETTING_CHANGE,
        eventData: {
          action: 'trial_extension',
          days,
          reason,
          newEndDate: newEndDate.toISOString()
        },
        severity: AuditSeverity.INFO
      });

      return true;
    } catch (error) {
      console.error('Error extending trial:', error);
      return false;
    }
  }

  public async convertTrial(userId: string, pricingPlan: PricingPlan): Promise<boolean> {
    try {
      // Update user profile
      const { error } = await supabase
        .from('user_profiles')
        .update({
          trial_status: TrialStatus.CONVERTED,
          conversion_date: new Date().toISOString(),
          pricing_plan: pricingPlan,
          is_pro: pricingPlan !== PricingPlan.FREE,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Log the conversion
      await auditLogger.log({
        userId,
        eventType: AuditEventType.SUBSCRIPTION_CHANGE,
        eventData: {
          action: 'trial_conversion',
          pricingPlan,
          conversionDate: new Date().toISOString()
        },
        severity: AuditSeverity.INFO
      });

      return true;
    } catch (error) {
      console.error('Error converting trial:', error);
      return false;
    }
  }

  public async checkAndUpdateTrialStatus(userId: string): Promise<TrialStatus> {
    try {
      // Get current trial info
      const trialInfo = await this.getTrialInfo(userId);
      if (!trialInfo) throw new Error('Trial info not found');

      // If already converted or expired, no need to check
      if (trialInfo.status !== TrialStatus.ACTIVE) {
        return trialInfo.status;
      }

      const now = new Date();
      
      // Check if trial has expired
      if (now > trialInfo.endDate) {
        // Update status to expired
        const { error } = await supabase
          .from('user_profiles')
          .update({
            trial_status: TrialStatus.EXPIRED,
            updated_at: now.toISOString()
          })
          .eq('user_id', userId);

        if (error) throw error;

        // Log the expiration
        await auditLogger.log({
          userId,
          eventType: AuditEventType.SYSTEM_SETTING_CHANGE,
          eventData: {
            action: 'trial_expiration',
            expirationDate: now.toISOString()
          },
          severity: AuditSeverity.INFO
        });

        return TrialStatus.EXPIRED;
      }

      return TrialStatus.ACTIVE;
    } catch (error) {
      console.error('Error checking trial status:', error);
      return TrialStatus.EXPIRED; // Default to expired on error
    }
  }

  public async getTrialNotifications(userId: string): Promise<any[]> {
    try {
      const trialInfo = await this.getTrialInfo(userId);
      if (!trialInfo) return [];

      const notifications = [];

      // Trial expiring soon notification
      if (trialInfo.status === TrialStatus.ACTIVE && trialInfo.daysLeft <= 3) {
        notifications.push({
          type: 'trial_expiring',
          daysLeft: trialInfo.daysLeft,
          expiryDate: trialInfo.endDate.toISOString()
        });
      }

      // Trial expired notification
      if (trialInfo.status === TrialStatus.EXPIRED) {
        notifications.push({
          type: 'trial_expired',
          expiryDate: trialInfo.endDate.toISOString()
        });
      }

      return notifications;
    } catch (error) {
      console.error('Error getting trial notifications:', error);
      return [];
    }
  }
}

export const trialManager = TrialManager.getInstance();