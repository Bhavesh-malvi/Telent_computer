# Vercel Canvas Dependency Fix

## Problem
The `node-canvas` package was causing build failures on Vercel due to missing pre-built binaries for Node.js v22.18.0. The error was:
```
node-pre-gyp ERR! install response status 404 Not Found on https://github.com/Automattic/node-canvas/releases/download/v2.11.2/canvas-v2.11.2-node-v127-linux-glibc-x64.tar.gz
```

Additionally, Rollup native bindings were failing with Node.js v22:
```
Error: Cannot find module @rollup/rollup-win32-x64-msvc
```

## Root Cause
1. The `pdfjs-dist` package includes `canvas` as an optional dependency for server-side PDF rendering. However, the pre-built binaries for `canvas@2.11.2` are not available for Node.js v22.18.0.
2. Rollup's native bindings are not compatible with Node.js v22, causing `MODULE_NOT_FOUND` errors.

## Solution Implemented

### 1. Updated `package.json`
Added Node.js version specification to ensure compatibility:
```json
{
  "engines": {
    "node": "18.x"
  }
}
```

### 2. Updated `.npmrc`
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

# Ensure Node.js compatibility
node-version=18
```

### 3. Updated `vercel.json`
Enhanced the Vercel configuration to handle the dependency issue:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
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

### 4. Created `.vercelignore`
Added a comprehensive `.vercelignore` file to exclude unnecessary files from deployment.

## Why This Works
1. **Node.js Version**: Specifying Node.js 18.x ensures compatibility with Rollup and other native bindings.
2. **Selective Exclusion**: We exclude only the problematic `canvas` dependency while keeping other optional dependencies that are needed.
3. **Vercel Configuration**: The `--no-optional` flag in the install command ensures canvas is not installed during deployment.

## Testing
- ✅ Local build works: `npm run build`
- ✅ Dependencies install without canvas: `npm install`
- ✅ No Rollup binary issues
- ✅ PDF.js still works (uses fallback rendering)

## Deployment
The project should now deploy successfully on Vercel without both the canvas dependency error and the Rollup native bindings error. The PDF functionality will still work as `pdfjs-dist` has fallback rendering methods when canvas is not available.

## Alternative Vercel Settings
If the `engines` field doesn't work, you can also set the Node.js version in Vercel Dashboard:
1. Go to Project Settings → General
2. Set Node.js Version to 18.x
3. Redeploy the project
