#!/bin/bash

# Set environment variable for Rollup JS fallback
export ROLLUP_USE_JS=true

# Run the build directly with vite
npx vite build
