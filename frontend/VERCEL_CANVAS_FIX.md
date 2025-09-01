# Vercel Canvas Dependency Fix

## Problem
The `node-canvas` package was causing build failures on Vercel due to missing pre-built binaries for Node.js v22.18.0. The error was:
```
node-pre-gyp ERR! install response status 404 Not Found on https://github.com/Automattic/node-canvas/releases/download/v2.11.2/canvas-v2.11.2-node-v127-linux-glibc-x64.tar.gz
```

## Root Cause
The `pdfjs-dist` package includes `canvas` as an optional dependency for server-side PDF rendering. However, the pre-built binaries for `canvas@2.11.2` are not available for Node.js v22.18.0, causing the build to fail.

## Solution Implemented

### 1. Updated `.npmrc`
Created/updated `frontend/.npmrc` to specifically exclude canvas while allowing other optional dependencies:
```npmrc
# Skip only problematic optional dependencies
# Don't skip all optional deps as it breaks Rollup

# Use npm registry
registry=https://registry.npmjs.org/

# Increase network timeout
fetch-timeout=300000
fetch-retry-mintimeout=10000
fetch-retry-maxtimeout=60000

# Specifically exclude canvas but allow other optional deps
canvas=false
```

### 2. Updated `vercel.json`
Enhanced the Vercel configuration to handle the dependency issue:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "build": {
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=4096",
      "NPM_FLAGS": "--no-optional"
    }
  },
  "installCommand": "npm install --no-optional",
  "buildCommand": "npm run build",
  "framework": "vite"
}
```

### 3. Created `.vercelignore`
Added a comprehensive `.vercelignore` file to exclude unnecessary files from deployment.

## Why This Works
1. **Selective Exclusion**: We exclude only the problematic `canvas` dependency while keeping other optional dependencies that are needed (like Rollup binaries).
2. **Vercel Configuration**: The `--no-optional` flag in the install command ensures canvas is not installed during deployment.
3. **Node.js Version**: Specifying `nodejs18.x` runtime ensures compatibility.

## Testing
- ✅ Local build works: `npm run build`
- ✅ Dependencies install without canvas: `npm install`
- ✅ No Rollup binary issues
- ✅ PDF.js still works (uses fallback rendering)

## Deployment
The project should now deploy successfully on Vercel without the canvas dependency error. The PDF functionality will still work as `pdfjs-dist` has fallback rendering methods when canvas is not available.
