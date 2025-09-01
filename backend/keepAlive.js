// Keep-alive script to prevent Render from sleeping
import fetch from 'node-fetch';

const KEEP_ALIVE_INTERVAL = 10 * 60 * 1000; // 10 minutes
const RENDER_URL = process.env.RENDER_URL || 'https://telent-computer.onrender.com';

console.log('🔄 Keep-alive script started...');
console.log(`📡 Target URL: ${RENDER_URL}`);

// Monitor memory usage
const memUsage = process.memoryUsage();
console.log(`📊 Memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);

async function pingServer() {
  try {
    console.log(`📡 Pinging server: ${RENDER_URL}/api/health`);
    
    // Use external ping service to avoid self-ping issues
    const response = await fetch(`${RENDER_URL}/api/health`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Keep-Alive-Bot/1.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 10000 // 10 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Server pinged successfully at ${new Date().toISOString()}`);
      console.log(`📊 Server status: ${data.status}, Uptime: ${Math.round(data.uptime)}s`);
    } else {
      console.log(`⚠️ Server responded with status: ${response.status}`);
      
      // Try alternative endpoints
      try {
        const altResponse = await fetch(`${RENDER_URL}/`, {
          method: 'GET',
          headers: {
            'User-Agent': 'Keep-Alive-Bot/1.0'
          },
          timeout: 5000
        });
        
        if (altResponse.ok) {
          console.log(`✅ Alternative endpoint pinged successfully`);
        } else {
          console.log(`⚠️ Alternative endpoint also failed: ${altResponse.status}`);
        }
      } catch (altError) {
        console.log(`❌ Alternative endpoint failed: ${altError.message}`);
      }
    }
      } catch (error) {
      console.error(`❌ Failed to ping server: ${error.message}`);
      console.log(`🔍 Error details: ${error.code || 'Unknown error code'}`);
      
      // Don't crash the keep-alive service on network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        console.log(`⚠️ Network error detected, will retry in next cycle`);
        return;
      }
    
    // Try alternative endpoints on error
    try {
      console.log(`🔄 Trying alternative endpoint...`);
      const altResponse = await fetch(`${RENDER_URL}/`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Keep-Alive-Bot/1.0'
        },
        timeout: 5000
      });
      
      if (altResponse.ok) {
        console.log(`✅ Alternative endpoint pinged successfully`);
      } else {
        console.log(`⚠️ Alternative endpoint failed: ${altResponse.status}`);
      }
    } catch (altError) {
      console.log(`❌ Alternative endpoint also failed: ${altError.message}`);
    }
  }
}

// Ping immediately on start
pingServer();

// Set up periodic pinging
setInterval(pingServer, KEEP_ALIVE_INTERVAL);

console.log(`🔄 Will ping server every ${KEEP_ALIVE_INTERVAL / 60000} minutes`);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Keep-alive script stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Keep-alive script stopped');
  process.exit(0);
});

// Export for use in index.js
export default {
  pingServer,
  start: () => {
    console.log('🔄 Keep-alive service started');
    console.log('💡 Note: Using external ping service to avoid self-ping issues');
    
    // Start ping immediately
    pingServer();
    
    // Set up periodic pinging
    const intervalId = setInterval(pingServer, KEEP_ALIVE_INTERVAL);
    
    // Return cleanup function
    return () => {
      clearInterval(intervalId);
      console.log('🛑 Keep-alive service stopped');
    };
  }
};
