# 📱 Configuración de Auto-Reload para Móvil

Esta guía te muestra cómo ejecutar **BACU CREATIVE** en tu celular con recarga automática durante el desarrollo.

---

## 🚀 Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Iniciar el servidor de desarrollo

```bash
npm run dev
```

O si prefieres ejecutarlo específicamente para móvil:

```bash
npm run dev:mobile
```

---

## 📱 Acceder desde tu Celular

Cuando ejecutes `npm run dev`, verás algo como esto:

```
╔════════════════════════════════════════════╗
║     🎬  BACU CREATIVE - DEV SERVER  🎬     ║
╚════════════════════════════════════════════╝

📱 Acceder desde el navegador:

  • Este dispositivo:  http://localhost:3000
  • Desde el móvil:    http://192.168.x.x:3000

✓ Monitoreo de cambios activo...
```

### Pasos para abrir en tu celular:

1. **Asegúrate de que tu celular está en la misma red WiFi** que tu computadora
2. Copia la IP que aparece en la terminal (ej: `http://192.168.1.100:3000`)
3. Abre tu navegador móvil
4. Pega la URL en la barra de direcciones
5. ¡Listo! La página se cargará y se recargará automáticamente con cada cambio

---

## ⚙️ Cómo Funciona

### **Auto-Reload por WebSocket**

El sistema usa WebSocket para una conexión persistente y eficiente:

- **Servidor** (`server.js`): Monitorea cambios en HTML, JS y CSS
- **Cliente** (`reload-client.js`): Se conecta al servidor y escucha actualizaciones
- **Recarga Automática**: Solo cuando hay cambios reales

### **Archivos Monitoreados**

Se recargan automáticamente cuando cambien:
- ✓ `*.html` - Estructura
- ✓ `*.js` - JavaScript
- ✓ `*.css` - Estilos
- ✓ `assets/*` - Imágenes y recursos

---

## 🛠️ Solución de Problemas

### No puedo conectar desde el móvil

**Problema:** "No se puede conectar a la red"

**Soluciones:**
1. ✓ Verifica que estés en la **misma red WiFi**
2. ✓ Copia la IP correcta (ve lo que aparece en la terminal)
3. ✓ Intenta sin VPN o desactiva el VPN
4. ✓ Si tu red tiene 5GHz y 2.4GHz, intenta cambiar de banda

### La página no se recarga automáticamente

**Problema:** Cambias archivos pero no se actualiza

**Soluciones:**
1. ✓ Verifica que veas `✓ Conectado al servidor de desarrollo` en la consola
2. ✓ Abre DevTools (F12) → Consola y verifica los mensajes
3. ✓ Recarga la página manualmente (Ctrl+R o Cmd+R)
4. ✓ Reinicia el servidor: Presiona Ctrl+C y ejecuta `npm run dev` de nuevo

### "Connection refused" en la consola

**Problema:** No se puede conectar al WebSocket

**Soluciones:**
1. ✓ Asegúrate de que el servidor está corriendo (`npm run dev`)
2. ✓ Verifica la IP en la terminal
3. ✓ Intenta acceder a `http://IP:3000` en el navegador primero
4. ✓ Revisa que el puerto 3000 no esté ocupado

### El navegador del móvil se congela

**Problema:** La página se congelsa después de cambios

**Soluciones:**
1. ✓ Reduce el número de cambios simultáneos
2. ✓ Intenta cambiar solo un archivo a la vez
3. ✓ Reinicia el navegador móvil

---

## 💡 Tips y Tricks

### **Desarrollar sin WiFi**

Si necesitas usar tu hotspot móvil:

```bash
# Especificar puerto diferente
PORT=8080 npm run dev
```

### **Ver logs del servidor**

El servidor muestra automáticamente:
- 📝 Cambios detectados
- ✓ Clientes conectados
- 🔄 Recargas en progreso

### **Depuración en Móvil**

1. Abre DevTools en el móvil (depende del navegador)
2. Ve a la pestaña "Consola"
3. Busca mensajes de `[Dev Server]`
4. Verifica la conexión WebSocket

---

## 📋 Flujo de Trabajo Recomendado

```
1. Ejecuta:     npm run dev
2. Abre en PC:  http://localhost:3000
3. Abre en móvil: http://192.168.x.x:3000
4. ¡A editar!

Cambios automáticos:
   Edita un archivo → Guarda (Ctrl+S)
   → Se recarga en ambos dispositivos
```

---

## 🚪 Detener el servidor

Presiona `Ctrl+C` en la terminal.

```
📴 Cerrando servidor...
✓ Servidor cerrado
```

---

## 📚 Más Información

- **Server**: `server.js` - Servidor HTTP + WebSocket
- **Cliente**: `reload-client.js` - Script de auto-reload
- **Dependencias**: `package.json`

¿Preguntas? Revisa la consola del navegador (F12) o la terminal para mensajes de debug.

¡Feliz desarrollo! 🚀
