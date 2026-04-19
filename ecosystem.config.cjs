module.exports = {
  apps: [
    {
      name: 'gateway-3000',
      script: './gateway.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '200M',
      env: { NODE_ENV: 'production' },
      error_file: './logs/gateway-3000.error.log',
      out_file: './logs/gateway-3000.out.log',
      time: true,
    },
  ],
}
