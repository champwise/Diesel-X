module.exports = {
  apps: [
    {
      name: "diesel-x",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/root/.openclaw/Diesel-X/diesel-x",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "500M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "/var/log/pm2/diesel-x-error.log",
      out_file: "/var/log/pm2/diesel-x-out.log",
      merge_logs: true,
    },
  ],
};
