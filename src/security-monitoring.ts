import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getSecurityDashboardData, getSecurityEvents, getSecurityAlerts } from './security-db';

// Security Monitoring API with real database integration
export class SecurityMonitoringAPI {
  private app: Hono;

  constructor() {
    this.app = new Hono();
    this.setupRoutes();
  }

  private setupRoutes() {
    // CORS middleware
    this.app.use('*', cors());

    // Dashboard data endpoint - Returns real data from database
    this.app.get('/dashboard', async (c) => {
      try {
        // Ensure security tables exist
        const { initializeSecurityTables } = await import('./security-db');
        await initializeSecurityTables();

        const dashboardData = await getSecurityDashboardData();
        return c.json(dashboardData);
      } catch (error) {
        console.error('Dashboard data error:', error);
        return c.json({ error: 'Failed to fetch dashboard data' }, 500);
      }
    });

        // Security events endpoint - Returns real events
        this.app.get('/events', async (c) => {
            try {
                // Ensure security tables exist
                const { initializeSecurityTables } = await import('./security-db');
                await initializeSecurityTables();

                const limit = parseInt(c.req.query('limit') || '50');
                const level = c.req.query('level');
                const events = await getSecurityEvents(limit, level);
                return c.json({ events });
            } catch (error) {
                console.error('Security events error:', error);
                return c.json({ error: 'Failed to fetch security events' }, 500);
            }
        });

        // Threat metrics endpoint - Returns real threat data
        this.app.get('/threats', async (c) => {
            try {
                // Ensure security tables exist
                const { initializeSecurityTables, getThreatSummary, getRateLimitStats } = await import('./security-db');
                await initializeSecurityTables();

                const threatMetrics = await getThreatSummary(7);
                const rateLimitStats = await getRateLimitStats(24);

                return c.json({
                    threatMetrics,
                    rateLimitStats
                });
            } catch (error) {
                console.error('Threat metrics error:', error);
                return c.json({ error: 'Failed to fetch threat metrics' }, 500);
            }
        });

        // Active sessions endpoint - Returns real sessions
        this.app.get('/sessions', async (c) => {
            try {
                // Ensure security tables exist
                const { initializeSecurityTables, getActiveSessions } = await import('./security-db');
                await initializeSecurityTables();

                const sessions = await getActiveSessions();
                return c.json({ sessions });
            } catch (error) {
                console.error('Active sessions error:', error);
                return c.json({ error: 'Failed to fetch active sessions' }, 500);
            }
        });

        // Security alerts endpoint - Returns real alerts
        this.app.get('/alerts', async (c) => {
            try {
                // Ensure security tables exist
                const { initializeSecurityTables, getSecurityAlerts } = await import('./security-db');
                await initializeSecurityTables();

                const alerts = await getSecurityAlerts('active', 50);
                return c.json({ alerts });
            } catch (error) {
                console.error('Security alerts error:', error);
                return c.json({ error: 'Failed to fetch security alerts' }, 500);
            }
        });

        // Rate limiting status endpoint - Returns real data
        this.app.get('/rate-limits', async (c) => {
            try {
                // Ensure security tables exist
                const { initializeSecurityTables, getRateLimitStats } = await import('./security-db');
                await initializeSecurityTables();

                const rateLimitData = await getRateLimitStats(24);
                return c.json(rateLimitData);
            } catch (error) {
                console.error('Rate limit status error:', error);
                return c.json({ error: 'Failed to fetch rate limit status' }, 500);
            }
        });
    }

    private getSimulatedDashboardData() {
        const now = new Date();

        // Generate realistic simulated data
        const metrics = {
            activeSessions: Math.floor(Math.random() * 15) + 5,
            totalRequests: Math.floor(Math.random() * 5000) + 10000,
            blockedRequests: Math.floor(Math.random() * 50) + 10,
            securityAlerts: Math.floor(Math.random() * 5) + 1,
            rateLimitHits: Math.floor(Math.random() * 25) + 5,
            uptime: '99.9%'
        };

        // Simulated alerts
        const alerts = this.getSimulatedAlerts().slice(0, 10);

        // Simulated logs
        const logs = this.getSimulatedEvents(20);

        // Simulated sessions
        const sessions = this.getSimulatedSessions();

        return {
            metrics,
            alerts,
            logs,
            sessions,
            threats: {
                bruteForce: Math.floor(Math.random() * 8) + 2,
                suspiciousIPs: Math.floor(Math.random() * 4) + 1,
                csrfAttempts: Math.floor(Math.random() * 12) + 3,
                sqlInjection: Math.floor(Math.random() * 3) + 1
            },
            timestamp: now.toISOString()
        };
    }

    private getSimulatedEvents(limit: number): SecurityEvent[] {
        const events: SecurityEvent[] = [];
        const eventTypes = [
            { level: 'info', messages: ['Security middleware initialized', 'User authentication successful', 'Session created'] },
            { level: 'warning', messages: ['Rate limit exceeded', 'Suspicious login attempt', 'CSRF token validation'] },
            { level: 'error', messages: ['Failed login attempt', 'Invalid token provided', 'Access denied'] }
        ];

        for (let i = 0; i < limit; i++) {
            const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            const message = eventType.messages[Math.floor(Math.random() * eventType.messages.length)];
            const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString();

            events.push({
                id: `evt_${Date.now()}_${i}`,
                level: eventType.level as 'info' | 'warning' | 'error',
                message,
                timestamp
            });
        }

        return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    private getSimulatedThreatMetrics() {
        return {
            bruteForceAttempts: Math.floor(Math.random() * 8) + 2,
            suspiciousIPs: Math.floor(Math.random() * 4) + 1,
            csrfAttempts: Math.floor(Math.random() * 12) + 3,
            sqlInjectionAttempts: Math.floor(Math.random() * 3) + 1,
            xssAttempts: Math.floor(Math.random() * 5) + 1,
            fileUploadViolations: Math.floor(Math.random() * 2) + 1,
            rateLimitViolations: Math.floor(Math.random() * 25) + 5,
            blockedRequests: Math.floor(Math.random() * 50) + 10,
            totalRequests: Math.floor(Math.random() * 5000) + 10000,
            activeThreats: Math.floor(Math.random() * 3) + 1
        };
    }

    private getSimulatedSessions(): SessionData[] {
        const sessions: SessionData[] = [];
        const users = ['admin@faithdefenders.org', 'moderator@faithdefenders.org', 'editor@faithdefenders.org'];
        const privileges = ['Super Admin', 'Admin', 'Moderator', 'Editor'];

        for (let i = 0; i < Math.floor(Math.random() * 8) + 3; i++) {
            sessions.push({
                id: `sess_${Date.now()}_${i}`,
                user: users[Math.floor(Math.random() * users.length)],
                privilege: privileges[Math.floor(Math.random() * privileges.length)],
                lastActivity: new Date(Date.now() - Math.random() * 30 * 60 * 1000).toISOString(),
                status: Math.random() > 0.2 ? 'active' : 'idle'
            });
        }

        return sessions;
    }

    private getSimulatedAlerts(): SecurityAlert[] {
        const alerts: SecurityAlert[] = [];
        const alertTypes: Array<{ type: 'info' | 'warning' | 'critical'; message: string; severity: 'low' | 'medium' | 'high' | 'critical' }> = [
            {
                type: 'warning',
                message: 'High rate limit hits detected from multiple IPs',
                severity: 'medium'
            },
            {
                type: 'info',
                message: 'Security scan completed successfully',
                severity: 'low'
            },
            {
                type: 'critical',
                message: 'Multiple failed authentication attempts detected',
                severity: 'high'
            },
            {
                type: 'warning',
                message: 'Suspicious file upload patterns detected',
                severity: 'medium'
            }
        ];

        const numAlerts = Math.floor(Math.random() * 4) + 1;
        for (let i = 0; i < numAlerts; i++) {
            const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
            alerts.push({
                id: `alert_${Date.now()}_${i}`,
                type: alertType.type,
                message: alertType.message,
                timestamp: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString(),
                severity: alertType.severity
            });
        }

        return alerts;
    }

    private getSimulatedRateLimitStatus() {
        const now = new Date();
        const ips = ['192.168.1.100', '10.0.0.50', '172.16.0.25', '203.0.113.1'];

        const recentHits = ips.map(ip => ({
            ip,
            hits: Math.floor(Math.random() * 20) + 1
        })).filter(item => item.hits > 0);

        return {
            totalHits: recentHits.reduce((sum, item) => sum + item.hits, 0),
            uniqueIPs: recentHits.length,
            topOffenders: recentHits.sort((a, b) => b.hits - a.hits).slice(0, 10),
            timestamp: now.toISOString()
        };
    }

    public getApp(): Hono {
        return this.app;
    }
}

// Type definitions
interface SecurityEvent {
    id: string;
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: string;
    details?: any;
}

interface SessionData {
    id: string;
    user: string;
    privilege: string;
    lastActivity: string;
    status: 'active' | 'idle' | 'expired';
}

interface SecurityAlert {
    id: string;
    type: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

// Export singleton instance
export const securityMonitoring = new SecurityMonitoringAPI();
