// PM2 Configuration for MoltBot Server
module.exports = {
  apps: [
    {
      name: 'moltbot',
      script: './dist/server.js',
      cwd: '/var/www/moltbot',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_file: '.env',
      error_file: '/var/log/moltbot/error.log',
      out_file: '/var/log/moltbot/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
