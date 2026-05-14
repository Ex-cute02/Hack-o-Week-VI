module.exports = {
  apps: [
    {
      name: "campus-pulse-backend",
      script: "./backend/src/server.js",
      cwd: __dirname,
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
      },
      wait_ready: true,
      listen_timeout: 5000,
      kill_timeout: 3000,
    },
  ],
};
