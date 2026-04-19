# Docker Implementation for KATSUMOTO Frontend

## Docker Files Created

### 1. **Dockerfile** (Production)
- Multi-stage build for optimized production image
- Builds with `vite build`
- Serves with `vite preview` on port 8551

### 2. **Dockerfile.dev** (Development)
- Single-stage for development with hot reload
- Serves with `vite dev` on port 8551
- Includes volume mounting for code changes

### 3. **docker-compose.yml** (Production)
- Builds and runs production image
- Maps port 8551:8551
- Requires environment variables in `.env`

### 4. **docker-compose.dev.yml** (Development)
- Uses Dockerfile.dev
- Includes volume mounts for hot reload
- Maps port 8551:8551

## Usage

### Development (with hot reload)
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Production
```bash
docker-compose up --build
```

### Stop containers
```bash
docker-compose down
# or for dev
docker-compose -f docker-compose.dev.yml down
```

## Environment Variables

Add these to your `.env` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Access

Once running, access the frontend at:
- http://localhost:8551
