const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const os = require('os');

// Configuración
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Obtener la IP local para móvil
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

// Tipos MIME
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// Crear servidor HTTP
const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

  // Prevenir directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    res.end(data);
  });
});

// Crear servidor WebSocket para live reload
const wss = new WebSocket.Server({ server });

let connectedClients = 0;

wss.on('connection', (ws) => {
  connectedClients++;
  console.log(`\n✓ Cliente conectado (${connectedClients} activos)`);

  ws.on('close', () => {
    connectedClients--;
    console.log(`✗ Cliente desconectado (${connectedClients} activos)`);
  });

  ws.on('error', (err) => {
    console.error('Error WebSocket:', err.message);
  });
});

function notifyClients() {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'reload' }));
    }
  });
}

// Monitorear cambios de archivos
const watcher = chokidar.watch([
  path.join(__dirname, '*.html'),
  path.join(__dirname, '*.js'),
  path.join(__dirname, '*.css'),
  path.join(__dirname, 'assets/**/*'),
], {
  ignored: /node_modules/,
  awaitWriteFinish: {
    stabilityThreshold: 300,
    pollInterval: 100,
  },
});

watcher.on('change', (file) => {
  console.log(`📝 Cambio detectado: ${path.relative(__dirname, file)}`);
  notifyClients();
  console.log(`🔄 Recargando ${connectedClients} cliente(s)...`);
});

watcher.on('add', (file) => {
  console.log(`✨ Archivo agregado: ${path.relative(__dirname, file)}`);
  notifyClients();
});

watcher.on('unlink', (file) => {
  console.log(`🗑️  Archivo eliminado: ${path.relative(__dirname, file)}`);
  notifyClients();
});

// Iniciar servidor
server.listen(PORT, HOST, () => {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║     🎬  BACU CREATIVE - DEV SERVER  🎬     ║');
  console.log('╚════════════════════════════════════════════╝\n');

  console.log('📱 Acceder desde el navegador:\n');
  console.log(`  • Este dispositivo:  http://localhost:${PORT}`);
  console.log(`  • Desde el móvil:    http://${localIP}:${PORT}\n`);

  console.log('ℹ️  Monitoreo de cambios activo...');
  console.log('   Cualquier cambio en HTML, JS o CSS se recargará automáticamente\n');

  console.log('💡 Tip: Abre tu móvil y accede a:');
  console.log(`   http://${localIP}:${PORT}\n`);
});

// Manejo de señales de cierre
process.on('SIGINT', () => {
  console.log('\n\n📴 Cerrando servidor...');
  watcher.close();
  server.close(() => {
    console.log('✓ Servidor cerrado');
    process.exit(0);
  });
});
