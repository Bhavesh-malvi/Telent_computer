#!/usr/bin/env node

/* global process */

// Set environment variable for Rollup JS fallback
process.env.ROLLUP_USE_JS = 'true';

// Import and run Vite build
import { build } from 'vite';

try {
  await build();
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
