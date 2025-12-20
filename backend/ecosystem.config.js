module.exports = {
  apps: [{
    name: 'kireydar-backend',
    script: 'server.js',
    cwd: '/www/wwwroot/Backendkireydar/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3035
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3035
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};