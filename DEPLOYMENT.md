# Deployment Guide

## Backend Deployment (Render)

### Issues Fixed:
1. ✅ **Import Error**: Fixed import statement placement in StudentDashboard.jsx
2. ✅ **Nodemon Permission**: Changed `start` script from `nodemon` to `node` for production

### Deployment Steps:
1. **Push to Git**: All changes are ready for deployment
2. **Render Settings**: 
   - Build Command: `npm install`
   - Start Command: `npm start` (now uses `node` instead of `nodemon`)
3. **Environment Variables**: Make sure to set these in Render:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - Any other environment variables your app needs

### What Changed:
- `backend/package.json`: `start` script now uses `node index.js` instead of `nodemon index.js`
- `backend/render.yaml`: Added deployment configuration
- `StudentManagment/src/pages/StudentDashboard.jsx`: Fixed import placement

## Frontend Deployment (Vercel)

### Environment Variables:
Create `.env` file in frontend root:
```env
VITE_API_URL=https://your-backend-url.onrender.com
VITE_SOCKET_URL=https://your-backend-url.onrender.com
```

### Deployment Steps:
1. **Push to Git**: All API endpoints are now centralized
2. **Vercel Settings**: 
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Environment Variables**: Set in Vercel dashboard:
   - `VITE_API_URL`
   - `VITE_SOCKET_URL`

## API Centralization ✅

All frontend API calls now use the centralized `apiConfig.js`:
- ✅ `StudentManagment/src/config/apiConfig.js` - Central configuration
- ✅ All components updated to use `getApiUrl()` and `getEndpoint()`
- ✅ Environment variables for easy URL switching

## Testing Deployment

After deployment:
1. **Backend**: Check if server starts without nodemon errors
2. **Frontend**: Verify API calls work with new centralized config
3. **WhatsApp**: Test connection flow in Settings page

## Troubleshooting

### If Backend Still Fails:
- Check Render logs for specific error messages
- Ensure all environment variables are set
- Verify MongoDB connection string is correct

### If Frontend API Calls Fail:
- Check browser console for CORS errors
- Verify `VITE_API_URL` is set correctly
- Ensure backend is running and accessible
