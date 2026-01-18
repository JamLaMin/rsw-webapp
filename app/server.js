const http = require('http');
const { execSync } = require('child_process');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

async function start() {
  if (process.env.NODE_ENV === 'production') {
    try {
      run('npx prisma db push');
      run('node prisma/seed.cjs');
    } catch (e) {
      console.error('Database init faalde:', e);
    }
  }

  const next = require('next');
  const app = next({ dev: process.env.NODE_ENV !== 'production', hostname: '0.0.0.0', port: 3000 });
  const handle = app.getRequestHandler();

  await app.prepare();

  const server = http.createServer((req, res) => handle(req, res));
  server.listen(3000, '0.0.0.0', () => {
    console.log('RSW app luistert op poort 3000');
  });
}

start();
