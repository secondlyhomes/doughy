// PM2 Configuration for OpenClaw Server
module.exports = {
  apps: [
    {
      name: 'openclaw',
      script: './dist/server.js',
      cwd: '/var/www/openclaw',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_file: '.env',
      error_file: '/var/log/openclaw/error.log',
      out_file: '/var/log/openclaw/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
