module.exports = {
  apps: [
    {
      name: 'faith-defenders',
      script: 'npx',
      args: 'wrangler pages dev dist --port 3000 --local',
      env: {
        NODE_ENV: 'development'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
