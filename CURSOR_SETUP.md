# Cursor AI Setup Guide

This guide helps you set up the AI Newsletter Automation Hub in Cursor AI for development and testing.

## Quick Start in Cursor

### 1. Clone and Open in Cursor

```bash
# Open project in Cursor
cursor .
```

### 2. Choose Your Setup Method

#### Option A: Mock Database (Recommended for Testing)
```bash
# Install dependencies and setup mock database
npm run setup:mock

# Start development server with mock data
npm run dev:mock
```

#### Option B: Full Setup with PostgreSQL
```bash
# Install dependencies and create .env file
npm run setup

# Edit .env file with your API keys
# At minimum, add ANTHROPIC_API_KEY

# Start with PostgreSQL (requires database setup)
npm run dev
```

### 3. Access the Application

Open [http://localhost:5000](http://localhost:5000) in your browser.

## Configuration Options

### Environment Variables (.env)

Create `.env` file from template:
```bash
cp .env.example .env
```

**Required for full functionality:**
- `ANTHROPIC_API_KEY` - Get from [Anthropic Console](https://console.anthropic.com/)

**Optional but recommended:**
- `BEEHIIV_API_KEY` - For newsletter publishing
- `BEEHIIV_PUBLICATION_ID` - Your publication ID
- `SENDGRID_API_KEY` - For email notifications

**Database options:**
```bash
# Use mock database (no setup required)
USE_MOCK_DB=true

# Use PostgreSQL (requires database setup)
DATABASE_URL=postgresql://user:pass@localhost:5432/newsletter_db
USE_MOCK_DB=false
```

### JSON Configuration (Alternative)

Create `config.json` from template:
```bash
cp config.example.json config.json
# Edit config.json with your settings
```

## Testing Features

### 1. Test News Fetching
- Navigate to "News Feeder" tab
- Use demo URL: `https://example.com/test-feed`
- Click "Fetch News" to load sample articles

### 2. Test Newsletter Generation
- Select some articles from the news feeder
- Go to "Newsletter Generator" tab
- Click "Generate Newsletter" (requires ANTHROPIC_API_KEY)

### 3. Test Social Media Features
- Generate a newsletter first
- Go to "Social Media" tab
- Generate social media posts for multiple platforms

## Database Options

### Mock Database (No Setup Required)
- ✅ **Perfect for development and testing**
- ✅ **Pre-loaded with sample data**
- ✅ **No external dependencies**
- ✅ **Works offline**

```bash
USE_MOCK_DB=true npm run dev
```

### PostgreSQL Database
- ✅ **Production-ready**
- ✅ **Persistent data**
- ✅ **Full feature support**

```bash
# Setup PostgreSQL
createdb newsletter_db

# Configure environment
DATABASE_URL=postgresql://user:pass@localhost:5432/newsletter_db
USE_MOCK_DB=false

# Run migrations
npm run db:push

# Start application
npm run dev
```

## Development Commands

```bash
# Development with mock database
npm run dev:mock

# Development with PostgreSQL
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npm run db:push      # Push schema changes
npm run db:studio    # Open database studio
npm run db:generate  # Generate migrations

# Configuration check
npm run check-config # Verify configuration
```

## API Testing

### Test Endpoints with curl

```bash
# Test news fetching (works with mock DB)
curl "http://localhost:5000/api/news/fetch?url=https://example.com/test-feed"

# Test settings
curl "http://localhost:5000/api/settings"

# Test articles
curl "http://localhost:5000/api/articles"

# Test configuration
curl "http://localhost:5000/api/health"
```

## Troubleshooting

### Common Issues in Cursor

1. **Port Already in Use**
   ```bash
   # Change port
   PORT=3001 npm run dev:mock
   ```

2. **Missing Dependencies**
   ```bash
   npm install
   ```

3. **Database Connection Errors**
   ```bash
   # Use mock database instead
   USE_MOCK_DB=true npm run dev
   ```

4. **API Key Issues**
   ```bash
   # Check configuration
   npm run check-config
   
   # Verify .env file exists and has ANTHROPIC_API_KEY
   cat .env
   ```

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev:mock
```

## Cursor AI Integration Tips

### 1. Use AI for Configuration
- Ask Cursor AI to help generate your `config.json`
- Get help with environment variable setup
- Generate API key configuration snippets

### 2. Development Workflow
```bash
# Start with mock database for rapid development
npm run dev:mock

# Test features without external dependencies
# Switch to real APIs when ready to test integrations
```

### 3. Code Exploration
- Use Cursor's "Find in Files" to explore API endpoints
- Search for `@shared/schema` to understand data models
- Look at `server/routes.ts` for API documentation

## Features Available in Mock Mode

### ✅ Fully Functional
- News article management
- Newsletter creation and editing
- Settings management
- Activity logging
- Social media post management
- Data export/import
- Feed source management
- Rich text editor
- Scheduling interface

### ⚠️ Limited Functionality (requires API keys)
- AI newsletter generation (needs ANTHROPIC_API_KEY)
- Beehiiv publishing (needs BEEHIIV_API_KEY)
- Email notifications (needs SENDGRID_API_KEY)
- Real RSS feed fetching (mock provides sample data)

## Next Steps

1. **Start with Mock Database**: Get familiar with the interface
2. **Add Anthropic API Key**: Test AI newsletter generation
3. **Add Publishing Keys**: Test full workflow
4. **Switch to PostgreSQL**: For persistent data in production

## Support

- Check `README.md` for detailed documentation
- Use mock database to isolate issues
- Test API endpoints with curl
- Check console logs for configuration warnings