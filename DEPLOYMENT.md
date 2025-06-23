# Deployment Guide

## Cursor AI / Local Development

### Quick Setup
```bash
# Clone repository
git clone <repository-url>
cd ai-newsletter-automation

# Setup with mock database (fastest)
npm run setup:mock
npm run dev:mock

# OR setup with environment file
npm run setup
# Edit .env with your API keys
npm run dev
```

### Environment Configuration

**Minimum Required (.env)**
```bash
USE_MOCK_DB=true
ANTHROPIC_API_KEY=your_api_key_here
```

**Full Configuration (.env)**
```bash
# Application
NODE_ENV=development
PORT=5000
USE_MOCK_DB=false

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/newsletter_db

# AI Service
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Publishing
BEEHIIV_API_KEY=your_beehiiv_api_key_here
BEEHIIV_PUBLICATION_ID=your_publication_id

# Email
SENDGRID_API_KEY=your_sendgrid_api_key_here
FROM_EMAIL=noreply@yourdomain.com

# Newsletter
NEWSLETTER_TITLE="AI Weekly Newsletter"
DEFAULT_NEWS_SOURCE=https://example.com/test-feed
```

## Production Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL database
- API keys for external services

### Build and Deploy
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with production values

# Setup database
npm run db:push

# Build application
npm run build

# Start production server
npm start
```

### Environment Variables (Production)
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
USE_MOCK_DB=false
ANTHROPIC_API_KEY=sk-...
BEEHIIV_API_KEY=...
SENDGRID_API_KEY=...
```

## Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/newsletter
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=newsletter
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Cloud Platforms

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in dashboard
```

### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway deploy
```

### Heroku
```bash
# Create app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set ANTHROPIC_API_KEY=your_key

# Deploy
git push heroku main
```

## Testing Deployment

### Health Check Endpoints
```bash
# Check application status
curl http://localhost:5000/api/settings

# Test news fetching
curl "http://localhost:5000/api/news/fetch?url=https://example.com/test-feed"

# Test articles endpoint
curl http://localhost:5000/api/articles
```

### Database Verification
```bash
# Check database connection
npm run check-config

# View database in studio
npm run db:studio
```

## Monitoring

### Logs
```bash
# Application logs
npm run dev 2>&1 | tee app.log

# Database logs
tail -f /var/log/postgresql/postgresql-*.log
```

### Metrics
- Monitor API response times
- Track newsletter generation success rates
- Monitor database connection health
- Track external API call limits

## Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Use mock database for testing
USE_MOCK_DB=true npm run dev
```

**API Key Errors**
```bash
# Verify configuration
npm run check-config

# Test with minimal setup
echo 'ANTHROPIC_API_KEY=your_key' > .env
echo 'USE_MOCK_DB=true' >> .env
```

**Port Already in Use**
```bash
# Change port
PORT=3001 npm run dev

# Kill existing process
lsof -ti:5000 | xargs kill
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Check configuration
npm run check-config
```

## Security

### API Keys
- Store in environment variables, never in code
- Use different keys for development/production
- Rotate keys regularly
- Monitor API usage

### Database
- Use connection pooling
- Enable SSL in production
- Regular backups
- Monitor for suspicious queries

### Application
- Keep dependencies updated
- Use HTTPS in production
- Implement rate limiting
- Monitor for errors

## Backup Strategy

### Database Backups
```bash
# Automated backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore backup
psql $DATABASE_URL < backup_20250623.sql
```

### Application Data
- Export newsletters and settings via API
- Backup configuration files
- Store API keys securely
- Document deployment procedures