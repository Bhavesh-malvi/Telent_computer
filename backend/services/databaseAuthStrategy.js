import mongoose from 'mongoose';

class DatabaseAuthStrategy {
  constructor() {
    this.sessionCollection = 'whatsappsessions';
  }

  // Check if session exists in database
  async hasSession() {
    try {
      // Check if database is connected
      if (!mongoose.connection || !mongoose.connection.db) {
        console.log('⚠️ Database not connected, cannot check session');
        return false;
      }
      
      const session = await mongoose.connection.db.collection(this.sessionCollection).findOne({
        clientId: 'tcit-whatsapp-client'
      });
      return !!session;
    } catch (error) {
      console.error('❌ Error checking session:', error);
      return false;
    }
  }

  // Store session in database
  async storeSession(sessionData) {
    try {
      // Check if database is connected
      if (!mongoose.connection || !mongoose.connection.db) {
        console.log('⚠️ Database not connected, cannot store session');
        return;
      }
      
      await mongoose.connection.db.collection(this.sessionCollection).updateOne(
        { clientId: sessionData.clientId },
        { 
          $set: {
            ...sessionData,
            lastUsed: new Date(),
            isActive: true
          }
        },
        { upsert: true }
      );
      console.log('✅ Session stored in database');
    } catch (error) {
      console.error('❌ Error storing session:', error);
    }
  }

  // Get session from database
  async getSession() {
    try {
      // Check if database is connected
      if (!mongoose.connection || !mongoose.connection.db) {
        console.log('⚠️ Database not connected, cannot get session');
        return null;
      }
      
      const session = await mongoose.connection.db.collection(this.sessionCollection).findOne({
        clientId: 'tcit-whatsapp-client'
      });
      return session;
    } catch (error) {
      console.error('❌ Error getting session:', error);
      return null;
    }
  }

  // Delete session from database
  async deleteSession() {
    try {
      // Check if database is connected
      if (!mongoose.connection || !mongoose.connection.db) {
        console.log('⚠️ Database not connected, cannot delete session');
        return;
      }
      
      await mongoose.connection.db.collection(this.sessionCollection).deleteMany({
        clientId: 'tcit-whatsapp-client'
      });
      console.log('✅ Session deleted from database');
    } catch (error) {
      console.error('❌ Error deleting session:', error);
    }
  }

  // Clear all sessions
  async clearAllSessions() {
    try {
      // Check if database is connected
      if (!mongoose.connection || !mongoose.connection.db) {
        console.log('⚠️ Database not connected, cannot clear sessions');
        return;
      }
      
      await mongoose.connection.db.collection(this.sessionCollection).deleteMany({});
      console.log('✅ All sessions cleared from database');
    } catch (error) {
      console.error('❌ Error clearing sessions:', error);
      // Don't throw error, just log it
    }
  }
}

export default DatabaseAuthStrategy;
