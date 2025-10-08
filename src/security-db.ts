// Security database functions for storing real security data
import { getDB } from './database-neon';

// Initialize security-related tables
export async function initializeSecurityTables() {
  console.log('Initializing security tables...');
  const sql = getDB();

  try {
    // Table for general security events
    await sql`
      CREATE TABLE IF NOT EXISTS security_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        level VARCHAR(20) DEFAULT 'info' CHECK (level IN ('info', 'warning', 'error', 'critical')),
        message TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        user_name VARCHAR(255),
        ip_address VARCHAR(45), -- IPv4/IPv6 support
        user_agent TEXT,
        url TEXT,
        method VARCHAR(10),
        request_data JSONB,
        headers JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved BOOLEAN DEFAULT false,
        resolved_at TIMESTAMP,
        resolved_by INTEGER REFERENCES users(id),
        notes TEXT
      );
    `;

    // Table for security alerts
    await sql`
      CREATE TABLE IF NOT EXISTS security_alerts (
        id SERIAL PRIMARY KEY,
        alert_type VARCHAR(50) NOT NULL, -- 'brute_force', 'suspicious_ip', 'csrf', 'sql_injection', etc.
        severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        trigger_count INTEGER DEFAULT 1,
        triggered_by TEXT, -- IP address or user ID
        first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
        resolved_at TIMESTAMP,
        resolved_by INTEGER REFERENCES users(id),
        metadata JSONB
      );
    `;

    // Table for threat attacks
    await sql`
      CREATE TABLE IF NOT EXISTS threat_attacks (
        id SERIAL PRIMARY KEY,
        attack_type VARCHAR(50) NOT NULL, -- 'brute_force', 'sql_injection', 'xss', 'csrf', etc.
        ip_address VARCHAR(45) NOT NULL,
        user_agent TEXT,
        url TEXT,
        method VARCHAR(10),
        payload TEXT,
        blocked BOOLEAN DEFAULT true,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER REFERENCES users(id),
        country VARCHAR(2),
        risk_score INTEGER DEFAULT 0, -- 0-100 risk score
        metadata JSONB
      );
    `;

    // Table for blocked IPs
    await sql`
      CREATE TABLE IF NOT EXISTS blocked_ips (
        id SERIAL PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL UNIQUE,
        reason TEXT,
        blocked_until TIMESTAMP,
        permanently_blocked BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        last_attempt TIMESTAMP,
        attempts INTEGER DEFAULT 0,
        country VARCHAR(2),
        risk_score INTEGER DEFAULT 0
      );
    `;

    // Table for rate limit events
    await sql`
      CREATE TABLE IF NOT EXISTS rate_limit_events (
        id SERIAL PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        user_id INTEGER REFERENCES users(id),
        route VARCHAR(255) NOT NULL,
        method VARCHAR(10),
        request_count INTEGER DEFAULT 1,
        window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        window_end TIMESTAMP,
        blocked BOOLEAN DEFAULT false,
        metadata JSONB
      );
    `;

    // Table for active sessions
    await sql`
      CREATE TABLE IF NOT EXISTS active_sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        user_name VARCHAR(255),
        user_email VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent TEXT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'idle', 'expired')),
        device_info JSONB,
        location_info JSONB
      );
    `;

    // Indices for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_security_events_level ON security_events(level);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address);`;

    await sql`CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts(status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON security_alerts(alert_type);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);`;

    await sql`CREATE INDEX IF NOT EXISTS idx_threat_attacks_ip ON threat_attacks(ip_address);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_threat_attacks_type ON threat_attacks(attack_type);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_threat_attacks_timestamp ON threat_attacks(timestamp);`;

    await sql`CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON blocked_ips(ip_address);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_blocked_ips_until ON blocked_ips(blocked_until);`;

    await sql`CREATE INDEX IF NOT EXISTS idx_rate_limit_ip ON rate_limit_events(ip_address);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON rate_limit_events(window_start, window_end);`;

    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user ON active_sessions(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_status ON active_sessions(status);`;

    console.log('Security tables initialized successfully');
  } catch (error) {
    console.error('Error initializing security tables:', error);
    throw error;
  }
}

// Security Events Functions
export async function logSecurityEvent(
  eventType: string,
  level: 'info' | 'warning' | 'error' | 'critical' = 'info',
  message: string,
  options?: {
    userId?: number;
    userName?: string;
    ipAddress?: string;
    userAgent?: string;
    url?: string;
    method?: string;
    requestData?: any;
    headers?: any;
  }
): Promise<void> {
  const sql = getDB();

  try {
    await sql`
      INSERT INTO security_events (
        event_type, level, message, user_id, user_name,
        ip_address, user_agent, url, method, request_data, headers
      ) VALUES (
        ${eventType}, ${level}, ${message}, ${options?.userId || null}, ${options?.userName || null},
        ${options?.ipAddress || null}, ${options?.userAgent || null}, ${options?.url || null},
        ${options?.method || null}, ${options?.requestData ? JSON.stringify(options.requestData) : null}, ${options?.headers ? JSON.stringify(options.headers) : null}
      )
    `;
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}

export async function getSecurityEvents(limit: number = 100, level?: string): Promise<any[]> {
  const sql = getDB();

  try {
    let query = sql`
      SELECT se.*,
             COALESCE(se.resolved, false) as resolved,
             rb.name as resolved_by_name
      FROM security_events se
      LEFT JOIN users rb ON se.resolved_by = rb.id
      ORDER BY se.timestamp DESC
      LIMIT ${limit}
    `;

    if (level && level !== 'all') {
      query = sql`
        SELECT se.*,
               COALESCE(se.resolved, false) as resolved,
               rb.name as resolved_by_name
        FROM security_events se
        LEFT JOIN users rb ON se.resolved_by = rb.id
        WHERE se.level = ${level}
        ORDER BY se.timestamp DESC
        LIMIT ${limit}
      `;
    }

    const result = await query;
    return result;
  } catch (error) {
    console.error('Error fetching security events:', error);
    return [];
  }
}

// Security Alerts Functions
export async function createSecurityAlert(
  alertType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  title: string,
  message: string,
  metadata?: any,
  triggeredBy?: string
): Promise<any> {
  const sql = getDB();

  try {
    const result = await sql`
      INSERT INTO security_alerts (
        alert_type, severity, title, message, metadata, triggered_by
      ) VALUES (
        ${alertType}, ${severity}, ${title}, ${message},
        ${metadata ? JSON.stringify(metadata) : null}, ${triggeredBy || null}
      ) RETURNING *
    `;

    // Check if we need to update an existing alert
    const existingAlertQuery = await sql`
      SELECT * FROM security_alerts
      WHERE alert_type = ${alertType} AND status = 'active'
      AND (triggered_by = ${triggeredBy} OR (triggered_by IS NULL AND ${triggeredBy} IS NULL))
      ORDER BY first_seen DESC
      LIMIT 1
    `;

    if (existingAlertQuery.length > 0) {
      const existingAlert = existingAlertQuery[0];
      await sql`
        UPDATE security_alerts
        SET trigger_count = trigger_count + 1,
            last_seen = CURRENT_TIMESTAMP,
            title = ${title},
            message = ${message},
            metadata = ${metadata ? JSON.stringify(metadata) : null}
        WHERE id = ${existingAlert.id}
        RETURNING *
      `;

      return existingAlert;
    }

    return result[0];
  } catch (error) {
    console.error('Error creating security alert:', error);
    return null;
  }
}

export async function getSecurityAlerts(status: string = 'active', limit: number = 50): Promise<any[]> {
  const sql = getDB();

  try {
    const result = await sql`
      SELECT sa.* FROM security_alerts sa
      WHERE status = ${status}
      ORDER BY sa.last_seen DESC, sa.first_seen DESC
      LIMIT ${limit}
    `;

    return result;
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    return [];
  }
}

// Threat Attacks Functions
export async function logThreatAttack(
  attackType: string,
  ipAddress: string,
  options?: {
    userAgent?: string;
    url?: string;
    method?: string;
    payload?: string;
    blocked?: boolean;
    userId?: number;
    country?: string;
    riskScore?: number;
    metadata?: any;
  }
): Promise<void> {
  const sql = getDB();

  try {
    await sql`
      INSERT INTO threat_attacks (
        attack_type, ip_address, user_agent, url, method, payload,
        blocked, user_id, country, risk_score, metadata
      ) VALUES (
        ${attackType}, ${ipAddress}, ${options?.userAgent || null}, ${options?.url || null},
        ${options?.method || null}, ${options?.payload || null},
        ${options?.blocked === undefined ? true : options.blocked}, ${options?.userId || null},
        ${options?.country || null}, ${options?.riskScore || 0}, ${options?.metadata ? JSON.stringify(options.metadata) : null}
      )
    `;

    // Create corresponding security alert
    const alertMessage = `Threat attack detected: ${attackType} from ${ipAddress}`;
    await createSecurityAlert(attackType, 'high', `Threat Attack: ${attackType}`, alertMessage, options, ipAddress);

  } catch (error) {
    console.error('Error logging threat attack:', error);
  }
}

export async function getThreatSummary(limit: number = 7): Promise<any> {
  const sql = getDB();

  try {
    const now = new Date();
    const pastWeek = new Date(now.getTime() - limit * 24 * 60 * 60 * 1000);

    const result = await sql`
      SELECT
        attack_type,
        COUNT(*) as count,
        COUNT(CASE WHEN blocked = true THEN 1 END) as blocked_count,
        COUNT(CASE WHEN blocked = false THEN 1 END) as unblocked_count,
        MAX(timestamp) as last_attack
      FROM threat_attacks
      WHERE timestamp >= ${pastWeek}
      GROUP BY attack_type
      ORDER BY count DESC
    `;

    return {
      totalAttacks: result.reduce((sum: any, r: any) => sum + parseInt(r.count), 0),
      types: result.map((r: any) => ({
        type: r.attack_type,
        count: parseInt(r.count),
        blocked: parseInt(r.blocked_count),
        unblocked: parseInt(r.unblocked_count),
        lastAttack: r.last_attack
      })),
      blocked: result.reduce((sum: any, r: any) => sum + parseInt(r.blocked_count), 0),
      unblocked: result.reduce((sum: any, r: any) => sum + parseInt(r.unblocked_count), 0)
    };
  } catch (error) {
    console.error('Error getting threat summary:', error);
    return { totalAttacks: 0, types: [], blocked: 0, unblocked: 0 };
  }
}

// Blocked IPs Functions
export async function blockIP(
  ipAddress: string,
  reason: string,
  createdBy: number,
  blockedUntil?: Date,
  permanently?: boolean
): Promise<boolean> {
  const sql = getDB();

  try {
    await sql`
      INSERT INTO blocked_ips (
        ip_address, reason, blocked_until, permanently_blocked, created_by
      ) VALUES (
        ${ipAddress}, ${reason}, ${blockedUntil || null}, ${permanently || false}, ${createdBy}
      ) ON CONFLICT (ip_address) DO UPDATE SET
        reason = EXCLUDED.reason,
        blocked_until = EXCLUDED.blocked_until,
        permanently_blocked = EXCLUDED.permanently_blocked,
        created_by = EXCLUDED.created_by,
        last_attempt = CURRENT_TIMESTAMP,
        attempts = blocked_ips.attempts + 1
    `;

    return true;
  } catch (error) {
    console.error('Error blocking IP:', error);
    return false;
  }
}

export async function isIPBlocked(ipAddress: string): Promise<boolean> {
  const sql = getDB();

  try {
    const result = await sql`
      SELECT * FROM blocked_ips
      WHERE ip_address = ${ipAddress}
      AND (permanently_blocked = true OR blocked_until > CURRENT_TIMESTAMP)
    `;

    return result.length > 0;
  } catch (error) {
    console.error('Error checking if IP is blocked:', error);
    return false;
  }
}

export async function getBlockedIPs(limit: number = 100): Promise<any[]> {
  const sql = getDB();

  try {
    const result = await sql`
      SELECT bi.*, cb.name as created_by_name
      FROM blocked_ips bi
      LEFT JOIN users cb ON bi.created_by = cb.id
      ORDER BY bi.created_at DESC
      LIMIT ${limit}
    `;

    return result;
  } catch (error) {
    console.error('Error getting blocked IPs:', error);
    return [];
  }
}

// Rate Limit Events Functions
export async function logRateLimitEvent(
  ipAddress: string,
  route: string,
  options?: {
    userId?: number;
    method?: string;
    requestCount?: number;
    windowStart?: Date;
    windowEnd?: Date;
    blocked?: boolean;
    metadata?: any;
  }
): Promise<void> {
  const sql = getDB();

  try {
    await sql`
      INSERT INTO rate_limit_events (
        ip_address, user_id, route, method, request_count,
        window_start, window_end, blocked, metadata
      ) VALUES (
        ${ipAddress}, ${options?.userId || null}, ${route}, ${options?.method || null},
        ${options?.requestCount || 1}, ${options?.windowStart || new Date()}, ${options?.windowEnd || null},
        ${options?.blocked || false}, ${options?.metadata ? JSON.stringify(options.metadata) : null}
      )
    `;

    // Create alert if blocked
    if (options?.blocked) {
      const alertMessage = `Rate limit exceeded from ${ipAddress} on ${route}`;
      await createSecurityAlert('rate_limit', 'medium', 'Rate Limit Exceeded', alertMessage, options, ipAddress);
    }

  } catch (error) {
    console.error('Error logging rate limit event:', error);
  }
}

export async function getRateLimitStats(hours: number = 24): Promise<any> {
  const sql = getDB();

  try {
    const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000);

    const result = await sql`
      SELECT
        COUNT(*) as total_events,
        COUNT(CASE WHEN blocked = true THEN 1 END) as blocked_events,
        COUNT(DISTINCT ip_address) as unique_ips,
        MAX(request_count) as max_requests
      FROM rate_limit_events
      WHERE window_start >= ${timeThreshold}
    `;

    const topOffenders = await sql`
      SELECT
        ip_address,
        user_id,
        SUM(request_count) as total_requests,
        COUNT(CASE WHEN blocked = true THEN 1 END) as blocked_count
      FROM rate_limit_events
      WHERE window_start >= ${timeThreshold}
      GROUP BY ip_address, user_id
      ORDER BY total_requests DESC
      LIMIT 10
    `;

    return {
      totalEvents: parseInt(result[0].total_events),
      blockedEvents: parseInt(result[0].blocked_events),
      uniqueIPs: parseInt(result[0].unique_ips),
      maxRequests: parseInt(result[0].max_requests),
      topOffenders: topOffenders.map(offender => ({
        ipAddress: offender.ip_address,
        userId: offender.user_id,
        totalRequests: parseInt(offender.total_requests),
        blockedCount: parseInt(offender.blocked_count)
      }))
    };
  } catch (error) {
    console.error('Error getting rate limit stats:', error);
    return { totalEvents: 0, blockedEvents: 0, uniqueIPs: 0, maxRequests: 0, topOffenders: [] };
  }
}

// Active Sessions Functions
export async function createSession(
  sessionId: string,
  userId: number,
  userName: string,
  userEmail: string,
  ipAddress?: string,
  userAgent?: string,
  expiresAt?: Date,
  deviceInfo?: any,
  locationInfo?: any
): Promise<void> {
  const sql = getDB();

  try {
    await sql`
      INSERT INTO active_sessions (
        id, user_id, user_name, user_email, ip_address, user_agent,
        expires_at, device_info, location_info
      ) VALUES (
        ${sessionId}, ${userId}, ${userName}, ${userEmail}, ${ipAddress || null}, ${userAgent || null},
        ${expiresAt || null}, ${deviceInfo ? JSON.stringify(deviceInfo) : null}, ${locationInfo ? JSON.stringify(locationInfo) : null}
      )
      ON CONFLICT (id) DO UPDATE SET
        last_activity = CURRENT_TIMESTAMP,
        user_name = EXCLUDED.user_name,
        user_email = EXCLUDED.user_email,
        ip_address = EXCLUDED.ip_address,
        user_agent = EXCLUDED.user_agent,
        device_info = EXCLUDED.device_info,
        location_info = EXCLUDED.location_info
    `;
  } catch (error) {
    console.error('Error creating session:', error);
  }
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  const sql = getDB();

  try {
    await sql`
      UPDATE active_sessions
      SET last_activity = CURRENT_TIMESTAMP
      WHERE id = ${sessionId}
    `;
  } catch (error) {
    console.error('Error updating session activity:', error);
  }
}

export async function removeExpiredSessions(): Promise<number> {
  const sql = getDB();

  try {
    const result = await sql`
      DELETE FROM active_sessions
      WHERE expires_at < CURRENT_TIMESTAMP
    `;

    return result.length;
  } catch (error) {
    console.error('Error removing expired sessions:', error);
    return 0;
  }
}

export async function removeSession(sessionId: string): Promise<boolean> {
  const sql = getDB();

  try {
    const result = await sql`
      DELETE FROM active_sessions
      WHERE id = ${sessionId}
    `;

    return result.length > 0;
  } catch (error) {
    console.error('Error removing session:', error);
    return false;
  }
}

export async function getActiveSessions(): Promise<any[]> {
  const sql = getDB();

  try {
    const result = await sql`
      SELECT as.*,
        CASE
          WHEN as.last_activity > CURRENT_TIMESTAMP - INTERVAL '5 minutes' THEN 'active'
          WHEN as.last_activity > CURRENT_TIMESTAMP - INTERVAL '30 minutes' THEN 'idle'
          ELSE 'expired'
        END as current_status
      FROM active_sessions as
      WHERE as.expires_at > CURRENT_TIMESTAMP
      ORDER BY as.last_activity DESC
    `;

    return result;
  } catch (error) {
    console.error('Error getting active sessions:', error);
    return [];
  }
}

export async function getSessionStats(): Promise<any> {
  const sql = getDB();

  try {
    const result = await sql`
      SELECT
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN last_activity > CURRENT_TIMESTAMP - INTERVAL '5 minutes' THEN 1 END) as active_sessions,
        COUNT(CASE WHEN last_activity > CURRENT_TIMESTAMP - INTERVAL '30 minutes'
                          AND last_activity <= CURRENT_TIMESTAMP - INTERVAL '5 minutes' THEN 1 END) as idle_sessions,
        COUNT(DISTINCT user_id) as unique_users
      FROM active_sessions
      WHERE expires_at > CURRENT_TIMESTAMP
    `;

    return {
      totalSessions: parseInt(result[0].total_sessions),
      activeSessions: parseInt(result[0].active_sessions),
      idleSessions: parseInt(result[0].idle_sessions),
      uniqueUsers: parseInt(result[0].unique_users)
    };
  } catch (error) {
    console.error('Error getting session stats:', error);
    return { totalSessions: 0, activeSessions: 0, idleSessions: 0, uniqueUsers: 0 };
  }
}

// Main security dashboard data function
export async function getSecurityDashboardData(): Promise<any> {
  // Ensure security tables exist before querying
  await initializeSecurityTables();

  const sql = getDB();

  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get real metrics from database
    const securityEventsResult = await sql`
      SELECT COUNT(*) FROM security_events
      WHERE timestamp >= ${last24h}
    `;

    const securityAlertsResult = await sql`
      SELECT COUNT(*) FROM security_alerts
      WHERE status = 'active' AND last_seen >= ${last24h}
    `;

    const blockedRequestsResult = await sql`
      SELECT COUNT(*) FROM rate_limit_events
      WHERE blocked = true AND window_start >= ${last24h}
    `;

    const rateLimitHitsResult = await sql`
      SELECT COUNT(*) FROM rate_limit_events
      WHERE window_start >= ${last24h}
    `;

    const threatSummary = await getThreatSummary(1);
    const sessionStats = await getSessionStats();

    // Get real log entries
    const logs = await getSecurityEvents(50);
    const alerts = await getSecurityAlerts('active', 10);

    return {
      metrics: {
        activeSessions: sessionStats.activeSessions,
        totalRequests: parseInt(securityEventsResult[0].count),
        blockedRequests: parseInt(blockedRequestsResult[0].count),
        securityAlerts: parseInt(securityAlertsResult[0].count),
        rateLimitHits: parseInt(rateLimitHitsResult[0].count),
        uptime: '99.9%'
      },
      alerts: alerts,
      logs: logs.map(log => ({
        id: log.id,
        level: log.level,
        message: `${log.event_type}: ${log.message}`,
        timestamp: log.timestamp
      })),
      threatMetrics: {
        totalAttacks: threatSummary.totalAttacks,
        blocked: threatSummary.blocked,
        unblocked: threatSummary.unblocked,
        types: threatSummary.types
      },
      threats: {
        bruteForce: threatSummary.types.find((t: any) => t.type === 'brute_force')?.count || 0,
        suspiciousIPs: (await sql`SELECT COUNT(DISTINCT ip_address) FROM threat_attacks WHERE timestamp >= ${last24h}`)[0].count,
        csrfAttempts: threatSummary.types.find((t: any) => t.type === 'csrf')?.count || 0,
        sqlInjection: threatSummary.types.find((t: any) => t.type === 'sql_injection')?.count || 0
      },
      timestamp: now.toISOString()
    };
  } catch (error) {
    console.error('Error getting security dashboard data:', error);
    // Instead of dummy data, return zeros to indicate no data available
    const now = new Date();
    return {
      metrics: {
        activeSessions: 0,
        totalRequests: 0,
        blockedRequests: 0,
        securityAlerts: 0,
        rateLimitHits: 0,
        uptime: 'N/A'
      },
      alerts: [],
      logs: [],
      threatMetrics: { totalAttacks: 0, blocked: 0, unblocked: 0, types: [] },
      threats: { bruteForce: 0, suspiciousIPs: 0, csrfAttempts: 0, sqlInjection: 0 },
      timestamp: now.toISOString()
    };
  }
}

// Cleanup functions
export async function cleanupExpiredData(): Promise<any> {
  const sql = getDB();

  try {
    const now = new Date();

    // Remove old security events (keep last 90 days)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oldEventsCount = (await sql`DELETE FROM security_events WHERE timestamp < ${ninetyDaysAgo}`).length;

    // Remove old rate limit events (keep last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oldRateLimitCount = (await sql`DELETE FROM rate_limit_events WHERE window_start < ${sevenDaysAgo}`).length;

    // Remove expired blocked IPs (automatically handled by queries, but clean up metadata)
    const expiredBlocksCount = (await sql`DELETE FROM blocked_ips WHERE blocked_until < ${now} AND permanently_blocked = false`).length;

    return {
      oldEventsRemoved: oldEventsCount,
      oldRateLimitRemoved: oldRateLimitCount,
      expiredBlocksRemoved: expiredBlocksCount
    };
  } catch (error) {
    console.error('Error cleaning up expired data:', error);
    return { error: 'Cleanup failed' };
  }
}
