import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import { EventEmitter } from 'events';

class WhatsAppConnectionService extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.isReady = false;
    this.isInitialized = false;
    this.connectionRetries = 0;
    this.maxRetries = 3;
    this.retryDelay = 5000;
    this.sessionCounter = 0;
    this.clientReadyTimeout = 30000; // 30 seconds for client ready check
    this.isInitializing = false; // Flag to prevent multiple simultaneous initializations
  }

  // Get unique session path
  getSessionPath() {
    this.sessionCounter++;
    return `./temp-whatsapp-sessions-${this.sessionCounter}`;
  }

  // Clean up old sessions
  async cleanupOldSessions() {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const sessionDir = './temp-whatsapp-sessions-*';
      const files = await fs.promises.readdir('./');
      
      for (const file of files) {
        if (file.startsWith('temp-whatsapp-sessions-')) {
          try {
            await fs.promises.rmdir(file, { recursive: true, force: true });
            console.log(`🧹 Cleaned up old session: ${file}`);
          } catch (error) {
            console.log(`⚠️ Could not clean up session ${file}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Error cleaning up sessions:', error.message);
    }
  }

  // Create WhatsApp client
  async createClient() {
    console.log('🔧 Creating WhatsApp client...');
    
    const puppeteerConfig = {
      headless: true,
      args: [
        // Minimal args for Render free plan stability
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--no-first-run',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-default-browser-check',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-domain-reliability',
        '--disable-component-extensions-with-background-pages',
        '--disable-background-networking',
        '--disable-client-side-phishing-detection',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        '--disable-component-update',
        '--disable-features=AudioServiceOutOfProcess,MediaRouter',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--disable-gpu-sandbox',
        '--disable-software-rasterizer',
        '--disable-file-system-watcher',
        '--memory-pressure-off',
        '--max_old_space_size=256',
        '--disable-features=site-per-process',
        '--disable-site-isolation-trials',
        '--disable-features=NetworkService',
        '--disable-features=NetworkServiceLogging',
        '--disable-features=VizDisplayCompositor',
        '--disable-features=AudioServiceOutOfProcess',
        '--disable-features=MediaRouter',
        '--disable-features=TranslateUI',
        '--disable-features=BlinkGenPropertyTrees',
        '--disable-features=site-per-process',
        '--disable-site-isolation-trials',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        '--disable-component-update',
        '--disable-features=AudioServiceOutOfProcess,MediaRouter',
        '--disable-features=VizDisplayCompositor',
        '--disable-features=NetworkService',
        '--disable-features=NetworkServiceLogging',
        '--disable-features=AudioServiceOutOfProcess',
        '--disable-features=MediaRouter',
        '--disable-features=TranslateUI',
        '--disable-features=BlinkGenPropertyTrees',
        '--disable-features=site-per-process',
        '--disable-site-isolation-trials',
        // Render-specific optimizations for stability
        '--single-process',
        '--no-zygote',
        '--safebrowsing-disable-auto-update',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-domain-reliability',
        '--disable-component-extensions-with-background-pages',
        '--disable-background-networking',
        '--disable-client-side-phishing-detection',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        '--disable-component-update',
        '--disable-features=AudioServiceOutOfProcess,MediaRouter',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--disable-gpu-sandbox',
        '--disable-software-rasterizer',
        '--disable-file-system-watcher',
        '--memory-pressure-off',
        '--max_old_space_size=256',
        '--disable-features=site-per-process',
        '--disable-site-isolation-trials',
        '--disable-features=NetworkService',
        '--disable-features=NetworkServiceLogging',
        '--disable-features=VizDisplayCompositor',
        '--disable-features=AudioServiceOutOfProcess',
        '--disable-features=MediaRouter',
        '--disable-features=TranslateUI',
        '--disable-features=BlinkGenPropertyTrees',
        '--disable-features=site-per-process',
        '--disable-site-isolation-trials',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        '--disable-component-update',
        '--disable-features=AudioServiceOutOfProcess,MediaRouter',
        '--disable-features=VizDisplayCompositor',
        '--disable-features=NetworkService',
        '--disable-features=NetworkServiceLogging',
        '--disable-features=AudioServiceOutOfProcess',
        '--disable-features=MediaRouter',
        '--disable-features=TranslateUI',
        '--disable-features=BlinkGenPropertyTrees',
        '--disable-features=site-per-process',
        '--disable-site-isolation-trials'
      ],
      timeout: 300000, // 5 minutes (increased for Render)
      protocolTimeout: 300000, // 5 minutes (increased for Render)
      ignoreDefaultArgs: ['--disable-extensions'],
      handleSIGINT: false,
      handleSIGTERM: false,
      handleSIGHUP: false,
      // Render-specific settings
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      ignoreHTTPSErrors: true,
      // Additional stability settings
      waitForInitialPage: false,
      defaultViewport: { width: 1280, height: 720 }
    };

    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'tcit-whatsapp-client',
        dataPath: this.getSessionPath()
      }),
      puppeteer: puppeteerConfig,
      // ✅ DISABLE CACHE TO FIX LocalWebCache.persist ERROR
      webVersionCache: {
        type: "none" // Disable cache completely
      }
    });
    
    console.log('✅ WhatsApp client created successfully');
  }

  // Setup event handlers
  async setupEventHandlers() {
    console.log('🔧 Setting up WhatsApp event handlers...');
    
    // QR Code event
    this.client.on('qr', async (qr) => {
      console.log('📱 QR Code received, scan it with WhatsApp');
      this.isInitialized = true;
      this.qrCode = qr; // Store QR code
      
      this.emit('qr-ready', {
        qrCode: qr,
        message: 'QR code generated, please scan',
        timestamp: new Date().toISOString()
      });
    });

      // Ready event
  this.client.on('ready', async () => {
    console.log('🎉 WhatsApp client is ready!');
    
    // Add a small delay to ensure client is fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.isReady = true;
    this.isInitialized = true;
    this.connectionRetries = 0;
    this.qrCode = null; // Clear QR code when ready
    
    // Verify client is actually ready
    try {
      if (this.client && this.client.info) {
        console.log('✅ Client verified as ready with info');
      } else {
        console.log('⚠️ Client ready but no info available yet');
      }
    } catch (error) {
      console.log('⚠️ Error verifying client ready status:', error.message);
    }
      
      // Process any pending admission confirmations
      try {
        const autoMessageScheduler = (await import('../../scheduler/autoMessageScheduler.js')).default;
        await autoMessageScheduler.processPendingAdmissionConfirmations();
      } catch (error) {
        console.error('❌ Error processing pending admission confirmations:', error);
      }
      
      this.emit('ready', {
        message: 'WhatsApp client is ready!',
        timestamp: new Date().toISOString()
      });
    });

    // Authentication success event
    this.client.on('authenticated', async () => {
      console.log('🔐 WhatsApp authentication successful!');
      
      // Add a small delay to ensure authentication is complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set ready status immediately after authentication
      this.isReady = true;
      this.isInitialized = true;
      this.qrCode = null; // Clear QR code
      
      this.emit('authenticated', {
        message: 'QR code scanned successfully, connecting...',
        timestamp: new Date().toISOString()
      });
      
      // Also emit ready event
      this.emit('ready', {
        message: 'WhatsApp client is ready!',
        timestamp: new Date().toISOString()
      });
    });

    // Authentication failure event
    this.client.on('auth_failure', async (msg) => {
      console.log('❌ WhatsApp authentication failed:', msg);
      this.isReady = false;
      
      this.emit('auth_failure', {
        message: 'Authentication failed, please try again',
        error: msg,
        timestamp: new Date().toISOString()
      });
    });

    // Disconnected event
    this.client.on('disconnected', async (reason) => {
      console.log('🔌 WhatsApp client disconnected:', reason);
      this.isReady = false;
      
      this.emit('disconnected', {
        message: `WhatsApp disconnected: ${reason}`,
        reason: reason,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Initialize WhatsApp client
  async initialize() {
    try {
      console.log('🔄 Starting WhatsApp client initialization...');
      
      // Clean up old sessions first
      console.log('🧹 Cleaning up old sessions...');
      await this.cleanupOldSessions();
      console.log('✅ Old sessions cleaned up');
      
      if (this.client) {
        console.log('🔌 Disconnecting existing client...');
        await this.disconnect();
        console.log('✅ Existing client disconnected');
      }
      
      // Reset session counter for new session
      this.sessionCounter = 0;
      console.log('🔄 Session counter reset');
      
      console.log('🔧 Creating new WhatsApp client...');
      await this.createClient();
      console.log('✅ Client created, setting up event handlers...');
      await this.setupEventHandlers();
      console.log('✅ Event handlers setup completed');
      
      // Add timeout and better error handling (optimized for Render free plan)
      console.log('🔄 Starting client initialization...');
      const initPromise = this.client.initialize();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Initialization timeout - client taking too long')), 120000); // 2 minutes
      });
      
      try {
        await Promise.race([initPromise, timeoutPromise]);
        console.log('✅ Client initialization promise resolved');
      } catch (timeoutError) {
        console.error('⏰ Initialization timeout:', timeoutError.message);
        throw timeoutError;
      }
      
      console.log('✅ WhatsApp client initialization completed');
    } catch (error) {
      console.error('❌ Error in WhatsApp initialization:', error);
      
      // Enhanced error recovery for Render free plan
      if (error.message.includes('Protocol error') || 
          error.message.includes('Target closed') || 
          error.message.includes('browser has disconnected') ||
          error.message.includes('Navigation failed')) {
        console.log('🔄 Browser disconnection error detected, attempting recovery...');
        
        // Clean up and retry with increased delays
        if (this.client) {
          try {
            await this.client.destroy();
          } catch (destroyError) {
            console.error('❌ Error destroying client:', destroyError);
          }
          this.client = null;
        }
        
        this.isReady = false;
        this.isInitialized = false;
        
        // Increased wait time for Render free plan
        console.log('⏳ Waiting 15 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        // Limit retries to prevent infinite loop
        if (this.connectionRetries < 3) {
          this.connectionRetries++;
          console.log(`🔄 Retrying WhatsApp initialization (attempt ${this.connectionRetries}/3)...`);
          return this.initialize();
        } else {
          console.error('❌ Max retries reached, giving up...');
          throw new Error('Max initialization retries reached due to browser disconnection issues');
        }
      }
      
      // Clean up on error
      if (this.client) {
        try {
          await this.client.destroy();
        } catch (destroyError) {
          console.error('❌ Error destroying client:', destroyError);
        }
        this.client = null;
      }
      
      this.isReady = false;
      this.isInitialized = false;
      
      throw error;
    }
  }

  // Disconnect client
  async disconnect() {
    try {
      if (this.client) {
        console.log('🔌 Disconnecting WhatsApp client...');
        
        // Add timeout for disconnect
        const disconnectPromise = this.client.destroy();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Disconnect timeout')), 10000);
        });
        
        await Promise.race([disconnectPromise, timeoutPromise]);
        this.client = null;
      }
      
      // Reset all states
      this.isReady = false;
      this.isInitialized = false;
      this.qrCode = null;
      this.connectionRetries = 0;
      
      // Clean up current session directory
      await this.cleanupCurrentSession();
      
      console.log('🔌 WhatsApp client disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting client:', error);
      
      // Force cleanup even if destroy fails
      this.client = null;
      this.isReady = false;
      this.isInitialized = false;
      this.qrCode = null;
      this.connectionRetries = 0;
      
      // Clean up current session directory
      await this.cleanupCurrentSession();
    }
  }

  // Clean up current session directory
  async cleanupCurrentSession() {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Get current session path
      const currentSessionPath = this.getSessionPath();
      
      // Check if session directory exists and clean it
      if (fs.existsSync(currentSessionPath)) {
        await fs.promises.rm(currentSessionPath, { recursive: true, force: true });
        console.log(`🧹 Cleaned up current session: ${currentSessionPath}`);
      }
      
      // Also clean up any other session directories
      const files = await fs.promises.readdir('./');
      for (const file of files) {
        if (file.startsWith('temp-whatsapp-sessions-')) {
          try {
            await fs.promises.rm(file, { recursive: true, force: true });
            console.log(`🧹 Cleaned up session: ${file}`);
          } catch (error) {
            console.log(`⚠️ Could not clean up session ${file}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Error cleaning up current session:', error.message);
    }
  }

  // Get connection status
  getStatus() {
    // Additional check for client ready status
    const clientReady = this.client && this.client.info;
    
    return {
      isInitialized: this.isInitialized,
      isReady: this.isReady || clientReady,
      connectionRetries: this.connectionRetries,
      hasClient: !!this.client,
      clientInfo: this.client?.info || null,
      clientState: null, // Don't call getState() synchronously
      hasValidClient: !!(this.client && typeof this.client.sendMessage === 'function' && (this.client.info || this.isReady))
    };
  }

  // Get QR code
  getQRCode() {
    return this.qrCode;
  }

  // Force QR regeneration with better error handling
  async regenerateQR() {
    try {
      console.log('🔄 Force regenerating QR code...');
      
      // Clean up existing client
      if (this.client) {
        try {
          await this.client.destroy();
        } catch (error) {
          console.error('❌ Error destroying client during QR regeneration:', error);
        }
        this.client = null;
      }
      
      // Reset states
      this.isReady = false;
      this.isInitialized = false;
      this.qrCode = null;
      this.connectionRetries = 0;
      
      // Clean up sessions
      await this.cleanupOldSessions();
      
      // Wait before creating new client
      console.log('⏳ Waiting 10 seconds before creating new client...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Create new client with fresh session
      await this.createClient();
      await this.setupEventHandlers();
      
      // Initialize with extended timeout
      const initPromise = this.client.initialize();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('QR regeneration timeout')), 360000); // 6 minutes
      });
      
      await Promise.race([initPromise, timeoutPromise]);
      
      console.log('✅ QR code regeneration completed');
      return { success: true, message: 'QR code regenerated successfully' };
      
    } catch (error) {
      console.error('❌ Error regenerating QR code:', error);
      
      // Clean up on error
      if (this.client) {
        try {
          await this.client.destroy();
        } catch (destroyError) {
          console.error('❌ Error destroying client:', destroyError);
        }
        this.client = null;
      }
      
      this.isReady = false;
      this.isInitialized = false;
      
      return { 
        success: false, 
        error: error.message,
        message: 'Failed to regenerate QR code'
      };
    }
  }

  // Alternative initialization method for Render free plan
  async initializeWithRetry() {
    // Prevent multiple simultaneous initialization calls
    if (this.isInitializing) {
      console.log('⚠️ Initialization already in progress, skipping...');
      return { success: false, message: 'Initialization already in progress' };
    }
    
    // If already ready, don't initialize again
    if (this.isReady && this.client) {
      console.log('✅ WhatsApp already ready, skipping initialization');
      return { success: true, message: 'WhatsApp already ready' };
    }
    
    this.isInitializing = true;
    const maxAttempts = 5;
    let attempt = 0;
    
    try {
      while (attempt < maxAttempts) {
        attempt++;
        console.log(`🔄 Initialization attempt ${attempt}/${maxAttempts}...`);
        
        try {
          await this.initialize();
          console.log('✅ Initialization successful!');
          return { success: true, message: 'WhatsApp initialized successfully' };
        } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxAttempts) {
          console.log(`⏳ Waiting 20 seconds before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, 20000));
          
          // Clean up before next attempt
          if (this.client) {
            try {
              await this.client.destroy();
            } catch (destroyError) {
              console.error('❌ Error destroying client:', destroyError);
            }
            this.client = null;
          }
          
          this.isReady = false;
          this.isInitialized = false;
        }
      }
      }
      
      console.error('❌ All initialization attempts failed');
      return { 
        success: false, 
        error: 'All initialization attempts failed',
        message: 'WhatsApp initialization failed after multiple attempts'
      };
    } finally {
      this.isInitializing = false; // Reset flag when done
    }
  }

  // Force ready status check
  async checkReadyStatus() {
    try {
      // If already ready, don't check again
      if (this.isReady && this.client && this.client.info) {
        return true;
      }
      
      // Simple check - if client has info, it's ready
      if (this.client && this.client.info) {
        console.log('✅ Client info found, setting ready status');
        this.isReady = true;
        this.isInitialized = true;
        return true;
      }
      
      // Check if client is connected even without info
      if (this.client && typeof this.client.getState === 'function') {
        try {
          const clientState = await this.client.getState();
          console.log(`📱 Client state in checkReadyStatus: ${clientState}`);
          
          if (clientState === 'CONNECTED') {
            console.log('✅ Client is connected, setting ready status');
            this.isReady = true;
            this.isInitialized = true;
            return true;
          }
        } catch (stateError) {
          console.log('⚠️ Could not get client state in checkReadyStatus:', stateError.message);
        }
      }
      
      // Don't call getState() to avoid infinite loops
      // Just return current status
      return this.isReady;
      
    } catch (error) {
      console.error('❌ Error checking ready status:', error);
      return false;
    }
  }

  // Get client state safely (async)
  async getClientState() {
    try {
      if (!this.client || typeof this.client.getState !== 'function') {
        return null;
      }
      
      // Add timeout to prevent hanging (increased for Render free plan)
      const statePromise = this.client.getState();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('State check timeout')), 15000); // 15 seconds
      });
      
      const state = await Promise.race([statePromise, timeoutPromise]);
      return state;
    } catch (error) {
      console.log('⚠️ Error getting client state:', error.message);
      return null;
    }
  }

  // Get client instance
  getClient() {
    return this.client;
  }
}

// Create singleton instance
const whatsappConnectionService = new WhatsAppConnectionService();

export default whatsappConnectionService;
