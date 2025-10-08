import { Hono } from 'hono'
import { Context } from 'hono'
import type { Next } from 'hono'
import { generateFooter } from '../utils/shared'

// Define the Security Dashboard component
export const SecurityDashboard = async ({ c }: { c: Context }) => {
  const user = await c.get('user') as any;

  // Only allow admin users to access the security dashboard
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return c.redirect('/login');
  }

  // For Cloudflare Workers, we'll serve the dashboard directly
  // In production, this would be served as a static file
  const dashboardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Faith Defenders - Security Monitoring Dashboard</title>
    <link rel="stylesheet" href="/static/style.css">

    <!-- Service Worker Registration -->
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
              console.log('Service Worker registered successfully:', registration.scope);
            })
            .catch(function(error) {
              console.log('Service Worker registration failed:', error);
            });
        });
      }
    </script>

    <style>
        .dashboard-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        .dashboard-header {
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .metric-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-left: 4px solid #1e3c72;
        }

        .metric-card.success { border-left-color: #28a745; }
        .metric-card.warning { border-left-color: #ffc107; }
        .metric-card.danger { border-left-color: #dc3545; }
        .metric-card.info { border-left-color: #17a2b8; }

        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
        }

        .metric-label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .alerts-section {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .alert-item {
            padding: 15px;
            border-left: 4px solid #ffc107;
            margin-bottom: 10px;
            background: #f8f9fa;
            border-radius: 5px;
        }

        .alert-item.critical { border-left-color: #dc3545; background: #f8d7da; }
        .alert-item.warning { border-left-color: #ffc107; background: #fff3cd; }
        .alert-item.info { border-left-color: #17a2b8; background: #d1ecf1; }

        .charts-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }

        .chart-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .logs-section {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .log-entry {
            padding: 10px;
            border-bottom: 1px solid #eee;
            font-family: monospace;
            font-size: 0.9em;
        }

        .log-entry.error { color: #dc3545; }
        .log-entry.warning { color: #856404; }
        .log-entry.info { color: #0c5460; }

        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }

        .status-online { background: #28a745; }
        .status-warning { background: #ffc107; }
        .status-offline { background: #dc3545; }

        .refresh-btn {
            background: #1e3c72;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-bottom: 20px;
        }

        .refresh-btn:hover {
            background: #2a5298;
        }

        .tabs {
            display: flex;
            margin-bottom: 20px;
            border-bottom: 1px solid #dee2e6;
        }

        .tab {
            padding: 10px 20px;
            cursor: pointer;
            border-bottom: 2px solid transparent;
        }

        .tab.active {
            border-bottom-color: #1e3c72;
            color: #1e3c72;
            font-weight: bold;
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        .admin-sessions {
            max-height: 400px;
            overflow-y: auto;
        }

        .session-item {
            padding: 10px;
            border: 1px solid #dee2e6;
            margin-bottom: 10px;
            border-radius: 5px;
        }

        .session-item.active {
            border-color: #28a745;
            background: #d4edda;
        }

        .threat-indicators {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }

        .threat-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }

        .threat-value {
            font-size: 1.5em;
            font-weight: bold;
            color: #dc3545;
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <div class="dashboard-header">
            <h1>🛡️ Faith Defenders Security Monitoring Dashboard</h1>
            <p>Real-time security monitoring and threat detection</p>
            <button class="refresh-btn" onclick="refreshDashboard()">🔄 Refresh Dashboard</button>
        </div>

        <!-- Navigation Tabs -->
        <div class="tabs">
            <div class="tab active" onclick="switchTab('overview')">Overview</div>
            <div class="tab" onclick="switchTab('threats')">Threat Detection</div>
            <div class="tab" onclick="switchTab('sessions')">Admin Sessions</div>
            <div class="tab" onclick="switchTab('logs')">Security Logs</div>
        </div>

        <!-- Overview Tab -->
        <div id="overview" class="tab-content active">
            <!-- Security Metrics -->
            <div class="metrics-grid">
                <div class="metric-card success">
                    <div class="metric-label">Active Sessions</div>
                    <div class="metric-value" id="active-sessions">0</div>
                    <div>Currently authenticated users</div>
                </div>

                <div class="metric-card info">
                    <div class="metric-label">Total Requests (24h)</div>
                    <div class="metric-value" id="total-requests">0</div>
                    <div>API requests in last 24 hours</div>
                </div>

                <div class="metric-card warning">
                    <div class="metric-label">Blocked Requests</div>
                    <div class="metric-value" id="blocked-requests">0</div>
                    <div>Requests blocked by security</div>
                </div>

                <div class="metric-card danger">
                    <div class="metric-label">Security Alerts</div>
                    <div class="metric-value" id="security-alerts">0</div>
                    <div>Active security alerts</div>
                </div>

                <div class="metric-card info">
                    <div class="metric-label">Rate Limit Hits</div>
                    <div class="metric-value" id="rate-limit-hits">0</div>
                    <div>Rate limit violations</div>
                </div>

                <div class="metric-card success">
                    <div class="metric-label">Uptime</div>
                    <div class="metric-value" id="uptime">100%</div>
                    <div>System availability</div>
                </div>
            </div>

            <!-- Charts -->
            <div class="charts-container">
                <div class="chart-card">
                    <h3>Request Activity (Last 24h)</h3>
                    <canvas id="activity-chart" width="400" height="200"></canvas>
                </div>

                <div class="chart-card">
                    <h3>Security Events Distribution</h3>
                    <canvas id="security-chart" width="400" height="200"></canvas>
                </div>
            </div>

            <!-- Recent Alerts -->
            <div class="alerts-section">
                <h3>Recent Security Alerts</h3>
                <div id="alerts-container">
                    <div class="alert-item info">
                        <strong>System Status:</strong> All security systems operational
                    </div>
                </div>
            </div>
        </div>

        <!-- Threat Detection Tab -->
        <div id="threats" class="tab-content">
            <div class="threat-indicators">
                <div class="threat-card">
                    <h4>Brute Force Attempts</h4>
                    <div class="threat-value" id="brute-force-count">0</div>
                    <small>Last 24 hours</small>
                </div>

                <div class="threat-card">
                    <h4>Suspicious IPs</h4>
                    <div class="threat-value" id="suspicious-ips">0</div>
                    <small>Currently blocked</small>
                </div>

                <div class="threat-card">
                    <h4>CSRF Attempts</h4>
                    <div class="threat-value" id="csrf-attempts">0</div>
                    <small>Last 24 hours</small>
                </div>

                <div class="threat-card">
                    <h4>SQL Injection Attempts</h4>
                    <div class="threat-value" id="sql-injection">0</div>
                    <small>Last 24 hours</small>
                </div>
            </div>

            <div class="chart-card" style="margin-top: 20px;">
                <h3>Threat Activity Timeline</h3>
                <canvas id="threat-chart" width="800" height="300"></canvas>
            </div>
        </div>

        <!-- Admin Sessions Tab -->
        <div id="sessions" class="tab-content">
            <div class="chart-card">
                <h3>Active Admin Sessions</h3>
                <div class="admin-sessions" id="admin-sessions">
                    <div class="session-item">
                        <div><strong>Session ID:</strong> <span id="session-id">Loading...</span></div>
                        <div><strong>User:</strong> <span id="session-user">Loading...</span></div>
                        <div><strong>Privilege Level:</strong> <span id="session-privilege">Loading...</span></div>
                        <div><strong>Last Activity:</strong> <span id="session-activity">Loading...</span></div>
                        <div><strong>Status:</strong> <span class="status-indicator status-online"></span>Active</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Security Logs Tab -->
        <div id="logs" class="tab-content">
            <div class="logs-section">
                <h3>Security Event Logs</h3>
                <div id="logs-container">
                    <div class="log-entry info">[INFO] Security dashboard initialized</div>
                    <div class="log-entry info">[INFO] All security systems operational</div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        // Security Dashboard Controller
        class SecurityDashboard {
            constructor() {
                this.charts = {};
                this.updateInterval = null;
                this.init();
            }

            init() {
                this.initializeCharts();
                this.loadDashboardData();
                this.startAutoRefresh();
            }

            initializeCharts() {
                // Activity Chart
                const activityCtx = document.getElementById('activity-chart').getContext('2d');
                this.charts.activity = new Chart(activityCtx, {
                    type: 'line',
                    data: {
                        labels: Array.from({length: 24}, (_, i) => \`\${i}:00\`),
                        datasets: [{
                            label: 'Requests',
                            data: Array.from({length: 24}, () => Math.floor(Math.random() * 100)),
                            borderColor: '#1e3c72',
                            backgroundColor: 'rgba(30, 60, 114, 0.1)',
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                });

                // Security Events Chart
                const securityCtx = document.getElementById('security-chart').getContext('2d');
                this.charts.security = new Chart(securityCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Normal', 'Warnings', 'Critical'],
                        datasets: [{
                            data: [85, 10, 5],
                            backgroundColor: ['#28a745', '#ffc107', '#dc3545']
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'bottom' }
                        }
                    }
                });

                // Threat Chart
                const threatCtx = document.getElementById('threat-chart').getContext('2d');
                this.charts.threat = new Chart(threatCtx, {
                    type: 'bar',
                    data: {
                        labels: Array.from({length: 7}, (_, i) => \`Day \${i + 1}\`),
                        datasets: [{
                            label: 'Threats Detected',
                            data: Array.from({length: 7}, () => Math.floor(Math.random() * 20)),
                            backgroundColor: '#dc3545'
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                });
            }

            async loadDashboardData() {
                try {
                    const response = await fetch('/api/security/dashboard');
                    if (!response.ok) {
                        throw new Error(\`HTTP error! status: \${response.status}\`);
                    }
                    const data = await response.json();
                    this.updateDashboard(data);
                } catch (error) {
                    console.error('Failed to load dashboard data:', error);
                    this.showError('Failed to load security data');
                }
            }

            updateDashboard(data) {
                // Update metrics
                this.updateMetrics(data);

                // Update alerts
                this.updateAlerts(data.alerts || []);

                // Update logs
                this.updateLogs(data.logs || []);

                // Update sessions
                this.updateSessions(data.sessions || []);
            }

            updateMetrics(data) {
                const metrics = data.metrics || {};
                document.getElementById('active-sessions').textContent = metrics.activeSessions || 0;
                document.getElementById('total-requests').textContent = (metrics.totalRequests || 0).toLocaleString();
                document.getElementById('blocked-requests').textContent = metrics.blockedRequests || 0;
                document.getElementById('security-alerts').textContent = metrics.securityAlerts || 0;
                document.getElementById('rate-limit-hits').textContent = metrics.rateLimitHits || 0;
                document.getElementById('uptime').textContent = metrics.uptime || '100%';

                // Update threat indicators
                const threats = data.threats || {};
                document.getElementById('brute-force-count').textContent = threats.bruteForce || 0;
                document.getElementById('suspicious-ips').textContent = threats.suspiciousIPs || 0;
                document.getElementById('csrf-attempts').textContent = threats.csrfAttempts || 0;
                document.getElementById('sql-injection').textContent = threats.sqlInjection || 0;
            }

            updateAlerts(alerts) {
                const container = document.getElementById('alerts-container');
                container.innerHTML = '';

                if (alerts.length === 0) {
                    container.innerHTML = '<div class="alert-item info"><strong>System Status:</strong> All security systems operational</div>';
                    return;
                }

                alerts.forEach(alert => {
                    const alertDiv = document.createElement('div');
                    alertDiv.className = \`alert-item \${alert.type || 'info'}\`;
                    alertDiv.innerHTML = \`
                        <strong>\${(alert.type || 'info').toUpperCase()}:</strong> \${alert.message}
                        <br><small>\${new Date(alert.timestamp).toLocaleString()}</small>
                    \`;
                    container.appendChild(alertDiv);
                });
            }

            updateLogs(logs) {
                const container = document.getElementById('logs-container');
                container.innerHTML = '';

                if (logs.length === 0) {
                    container.innerHTML = '<div class="log-entry info">[INFO] Security dashboard initialized</div>';
                    return;
                }

                logs.forEach(log => {
                    const logDiv = document.createElement('div');
                    logDiv.className = \`log-entry \${log.level || 'info'}\`;
                    logDiv.innerHTML = \`[\${new Date(log.timestamp).toLocaleString()}] \${log.message}\`;
                    container.appendChild(logDiv);
                });
            }

            updateSessions(sessions) {
                const container = document.getElementById('admin-sessions');
                container.innerHTML = '';

                if (sessions.length === 0) {
                    container.innerHTML = '<div class="session-item">No active admin sessions</div>';
                    return;
                }

                sessions.forEach(session => {
                    const sessionDiv = document.createElement('div');
                    sessionDiv.className = \`session-item \${session.status || 'active'}\`;
                    sessionDiv.innerHTML = \`
                        <div><strong>Session ID:</strong> \${session.id}</div>
                        <div><strong>User:</strong> \${session.user}</div>
                        <div><strong>Privilege Level:</strong> \${session.privilege}</div>
                        <div><strong>Last Activity:</strong> \${new Date(session.lastActivity).toLocaleString()}</div>
                        <div><strong>Status:</strong> <span class="status-indicator status-online"></span>\${session.status || 'active'}</div>
                    \`;
                    container.appendChild(sessionDiv);
                });
            }

            startAutoRefresh() {
                this.updateInterval = setInterval(() => {
                    this.loadDashboardData();
                }, 30000); // Refresh every 30 seconds
            }

            stopAutoRefresh() {
                if (this.updateInterval) {
                    clearInterval(this.updateInterval);
                    this.updateInterval = null;
                }
            }

            showError(message) {
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert-item danger';
                alertDiv.innerHTML = \`<strong>ERROR:</strong> \${message}\`;
                document.getElementById('alerts-container').prepend(alertDiv);

                setTimeout(() => {
                    alertDiv.remove();
                }, 5000);
            }
        }

        // Tab switching functionality
        function switchTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });

            // Show selected tab content
            document.getElementById(tabName).classList.add('active');

            // Add active class to selected tab
            event.target.classList.add('active');
        }

        // Refresh dashboard function
        function refreshDashboard() {
            if (window.dashboard) {
                window.dashboard.loadDashboardData();
            }
        }

        // Initialize dashboard when page loads
        document.addEventListener('DOMContentLoaded', () => {
            window.dashboard = new SecurityDashboard();
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (window.dashboard) {
                window.dashboard.stopAutoRefresh();
            }
        });
    </script>
</body>
</html>`;

  return c.html(dashboardHtml);
};
