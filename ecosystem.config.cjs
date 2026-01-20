module.exports = {
  apps: [
    {
      name: 'fin-terminal',
      script: 'cargo',
      args: 'run --release',
      env: {
        PORT: 3002,
        RUST_LOG: 'info',
      },
      env_production: {
        PORT: 3002,
        RUST_LOG: 'warn',
      },
      // Ensure the process is restarted if it crashes
      autorestart: true,
      // Delay between restarts
      restart_delay: 4000,
      // Maximum memory before restart
      max_memory_restart: '1G',
    },
  ],
};
