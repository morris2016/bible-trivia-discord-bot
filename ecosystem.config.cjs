module.exports = {
  apps: [
    {
      name: 'faith-defenders',
      script: 'cmd.exe',
      args: '/c npx wrangler pages dev dist --port 3000 --local',
      env: {
        NODE_ENV: 'development'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'discord-bot',
      script: './discord-bot/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info'
      },
      env_file: './discord-bot/.env'
    }
  ]
}
