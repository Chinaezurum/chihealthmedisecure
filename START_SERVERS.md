# How to Run the Servers

## Quick Start (Recommended)

Run both frontend and backend servers together:

```bash
npm run dev:all
```

This will start:
- **Backend**: http://localhost:8080
- **Frontend**: http://localhost:5173 (or the next available port)

## Running Servers Separately

### Backend Only
```bash
npm run dev:backend
```
Or manually:
```bash
cd backend
npm run dev
```

### Frontend Only
```bash
npm run dev:frontend
```
Or manually:
```bash
npm run dev
```

## Server Details

### Backend Server
- **Port**: 8080 (configurable via `PORT` environment variable)
- **Location**: `backend/src/server.ts`
- **Dev Command**: Uses `tsx watch` for hot reloading
- **API Endpoints**: All API routes are prefixed with `/api`
- **WebSocket**: Available at `/ws`
- **Note**: In development, the backend only serves API routes. Visit the frontend on port 5173, not 8080.

### Frontend Server
- **Port**: 5173 (default Vite port)
- **Location**: Root directory (Vite config)
- **Dev Command**: Uses `vite` dev server
- **Proxy**: Automatically proxies `/api` and `/ws` requests to backend on port 8080
- **Access**: Visit http://localhost:5173 (not 8080) in development

## Environment Variables (Optional)

### Frontend Environment Variables

Create a `.env` file in the root directory for frontend environment variables:

```bash
# Google Gemini API Key (for AI features)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Important**: In Vite, only environment variables prefixed with `VITE_` are exposed to the client. Without this key, AI features will not work, but the rest of the app will function normally.

### Backend Environment Variables

The backend will work with default values, but you can set these for production:

- `JWT_SECRET`: Secret key for JWT tokens (default: 'your-default-super-secret-key-that-is-long')
- `PORT`: Backend server port (default: 8080)
- `GOOGLE_CLIENT_ID`: For Google OAuth (default: 'mock-client-id')
- `GOOGLE_CLIENT_SECRET`: For Google OAuth (default: 'mock-client-secret')

## Troubleshooting

### Port Already in Use
If port 8080 is already in use:
- Windows: `netstat -ano | findstr :8080` to find the process
- Kill the process or change the `PORT` environment variable

### Dependencies Not Installed
If you get module errors:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

