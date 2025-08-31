#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * This script checks if all required environment variables are set
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../backend/.env') });

// Required environment variables for backend
const requiredBackendVars = [
  'MONGO_URL',
  'JWT_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

// Optional environment variables for backend
const optionalBackendVars = [
  'PORT',
  'NODE_ENV',
  'RENDER_URL',
  'CORS_ORIGIN',
  'WHATSAPP_SESSION_PATH',
  'WHATSAPP_CLIENT_ID',
  'LOG_LEVEL',
  'ENABLE_DEBUG_LOGS'
];

// Required environment variables for frontend
const requiredFrontendVars = [
  'VITE_API_URL'
];

// Optional environment variables for frontend
const optionalFrontendVars = [
  'VITE_API_BASE_URL',
  'VITE_SOCKET_URL',
  'VITE_ENABLE_DEBUG',
  'VITE_LOG_LEVEL',
  'VITE_ENABLE_WHATSAPP',
  'VITE_ENABLE_AUTO_LOGOUT',
  'VITE_INACTIVITY_TIMEOUT',
  'VITE_SESSION_TIMEOUT',
  'VITE_DEV_MODE'
];

console.log('🔍 Validating Environment Variables...\n');

// Check backend variables
console.log('📦 Backend Environment Variables:');
let backendErrors = 0;

requiredBackendVars.forEach(varName => {
  if (!process.env[varName]) {
    console.log(`❌ Missing required: ${varName}`);
    backendErrors++;
  } else {
    console.log(`✅ Found: ${varName}`);
  }
});

optionalBackendVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ Found optional: ${varName}`);
  } else {
    console.log(`⚠️  Missing optional: ${varName}`);
  }
});

// Check JWT_SECRET length
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.log('❌ JWT_SECRET must be at least 32 characters long');
  backendErrors++;
}

// Check email configuration
if (process.env.EMAIL_USER && !process.env.EMAIL_USER.includes('@')) {
  console.log('❌ EMAIL_USER must be a valid email address');
  backendErrors++;
}

console.log(`\n📊 Backend Summary: ${backendErrors} errors found\n`);

// Check frontend variables (if .env file exists)
try {
  const frontendEnvPath = join(__dirname, '../StudentManagment/.env');
  const frontendEnv = dotenv.parse(frontendEnvPath);
  
  console.log('🎨 Frontend Environment Variables:');
  let frontendErrors = 0;

  requiredFrontendVars.forEach(varName => {
    if (!frontendEnv[varName]) {
      console.log(`❌ Missing required: ${varName}`);
      frontendErrors++;
    } else {
      console.log(`✅ Found: ${varName}`);
    }
  });

  optionalFrontendVars.forEach(varName => {
    if (frontendEnv[varName]) {
      console.log(`✅ Found optional: ${varName}`);
    } else {
      console.log(`⚠️  Missing optional: ${varName}`);
    }
  });

  console.log(`\n📊 Frontend Summary: ${frontendErrors} errors found\n`);
  
  if (frontendErrors > 0) {
    console.log('💡 Frontend .env file not found or incomplete. Please create one based on env.example');
  }
} catch (error) {
  console.log('⚠️  Frontend .env file not found. Please create one based on env.example\n');
}

// Final summary
if (backendErrors === 0) {
  console.log('🎉 All required environment variables are properly configured!');
  process.exit(0);
} else {
  console.log(`❌ ${backendErrors} required environment variables are missing. Please check your .env file.`);
  process.exit(1);
}
