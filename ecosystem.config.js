module.exports = {
  apps: [{
    name: 'tutorial-2',
    script: './index.js'
  }],
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'server.pinqiblo.com',
      key: '~/.ssh/BenBill.pem',
      ref: 'origin/master',
      repo: 'git@github.com:pinqiblo2/BenBillBot.git',
      path: '/home/ubuntu/BenBillBot',
      'post-deploy': 'npm install && pm2 startOrRestart ecosystem.config.js'
    }
  }
}
