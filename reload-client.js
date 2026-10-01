/**
 * Auto-reload client para desarrollo
 * Se conecta al servidor WebSocket y recarga la página cuando hay cambios
 */

(function() {
  const isDev = !window.location.hostname.startsWith('branntt.github.io');

  if (!isDev) {
    console.log('[Dev Server] Deshabilitado en producción');
    return;
  }

  const RECONNECT_INTERVAL = 3000; // 3 segundos
  const MAX_RECONNECT_ATTEMPTS = 10;
  let reconnectAttempts = 0;
  let ws = null;

  function getWebSocketURL() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }

  function connect() {
    try {
      ws = new WebSocket(getWebSocketURL());

      ws.addEventListener('open', () => {
        reconnectAttempts = 0;
        console.log('✓ Conectado al servidor de desarrollo');
      });

      ws.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'reload') {
            console.log('🔄 Cambios detectados, recargando...');
            // Esperar un poco para asegurar que todos los archivos están listos
            setTimeout(() => {
              window.location.reload();
            }, 300);
          }
        } catch (err) {
          console.error('Error procesando mensaje:', err);
        }
      });

      ws.addEventListener('close', () => {
        console.log('✗ Desconectado del servidor');
        attemptReconnect();
      });

      ws.addEventListener('error', (event) => {
        console.error('Error WebSocket:', event);
        attemptReconnect();
      });
    } catch (err) {
      console.error('Error conectando:', err);
      attemptReconnect();
    }
  }

  function attemptReconnect() {
    reconnectAttempts++;

    if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
      console.warn('⚠️  No se pudo conectar al servidor de desarrollo');
      return;
    }

    console.log(`🔄 Reintentando conexión (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
    setTimeout(() => {
      connect();
    }, RECONNECT_INTERVAL);
  }

  // Conectar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connect);
  } else {
    connect();
  }
})();
