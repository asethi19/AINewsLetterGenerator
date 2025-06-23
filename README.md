# AI Newsletter Automation Hub

A comprehensive AI-powered newsletter automation system that fetches news, generates newsletters using Claude AI, and publishes them through Beehiiv with social media automation.

## Features

- 🤖 **AI-Powered Content Generation** - Uses Anthropic Claude for intelligent newsletter creation
- 📰 **Multi-Source News Aggregation** - Supports RSS, Atom, JSON feeds with unlimited sources
- 📧 **Newsletter Publishing** - Direct integration with Beehiiv for seamless publishing
- 📱 **Social Media Automation** - Generates and schedules posts for Twitter/X, Instagram, YouTube Shorts
- ⏰ **Smart Scheduling** - Automated daily, weekly, monthly newsletter generation
- 📊 **Rich Analytics** - Comprehensive activity logging and performance tracking
- 🎨 **Rich Text Editor** - Multi-platform preview (mobile, desktop, email)
- 💾 **Data Management** - Export, backup, and data lifecycle management
- 🔧 **Flexible Configuration** - Environment variables and JSON config support

## Quick Start

### Option 1: Using Environment Variables (Recommended)

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd ai-newsletter-automation
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and settings
   ```

3. **Run the Application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

### Option 2: Using Configuration File

1. **Create Configuration**
   ```bash
   cp config.example.json config.json
   # Edit config.json with your settings
   ```

2. **Run with Mock Database** (for testing)
   ```bash
   USE_MOCK_DB=true npm run dev
   ```

## Configuration

### Required API Keys

- **ANTHROPIC_API_KEY** - Get from [Anthropic Console](https://console.anthropic.com/)
- **BEEHIIV_API_KEY** - Get from [Beehiiv Settings](https://app.beehiiv.com/)
- **BEEHIIV_PUBLICATION_ID** - Your Beehiiv publication ID
- **SENDGRID_API_KEY** - Get from [SendGrid](https://sendgrid.com/) (optional)

### Database Options

#### PostgreSQL (Production)
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/newsletter_db
USE_MOCK_DB=false
```

#### Mock Database (Testing)
```bash
USE_MOCK_DB=true
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `USE_MOCK_DB` | Use mock database for testing | `false` |
| `ANTHROPIC_API_KEY` | Anthropic API key | Required |
| `ANTHROPIC_MODEL` | Claude model to use | `claude-sonnet-4-20250514` |
| `BEEHIIV_API_KEY` | Beehiiv API key | Optional |
| `BEEHIIV_PUBLICATION_ID` | Beehiiv publication ID | Optional |
| `SENDGRID_API_KEY` | SendGrid API key | Optional |
| `NEWSLETTER_TITLE` | Default newsletter title | `AI Weekly Newsletter` |
| `DEFAULT_NEWS_SOURCE` | Default RSS/JSON feed URL | Inoreader AI feed |
| `ENABLE_SCHEDULING` | Enable automated scheduling | `true` |
| `ENABLE_SOCIAL_MEDIA` | Enable social media features | `true` |

## Database Setup

### PostgreSQL Setup

1. **Install PostgreSQL**
   ```bash
   # macOS
   brew install postgresql
   
   # Ubuntu/Debian
   sudo apt install postgresql postgresql-contrib
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create Database**
   ```sql
   createdb newsletter_db
   ```

3. **Run Migrations**
   ```bash
   npm run db:push
   ```

### Mock Database (No Setup Required)

The mock database is perfect for:
- Testing the application
- Development without PostgreSQL
- Demonstrations
- CI/CD pipelines

## Development Workflow

### With Cursor AI

1. **Open in Cursor**
   ```bash
   cursor .
   ```

2. **Setup Development Environment**
   ```bash
   cp .env.example .env
   # Configure with your API keys
   USE_MOCK_DB=true npm run dev
   ```

3. **Test with Sample Data**
   - Navigate to the News Feeder
   - Use URL: `https://example.com/test-feed`
   - This provides realistic sample articles for testing

### Without Replit

The application is fully portable and works independently:

- ✅ **No Replit Dependencies** - Runs on any Node.js environment
- ✅ **Flexible Database** - PostgreSQL or mock database options
- ✅ **Environment Configuration** - Standard .env file support
- ✅ **Cross-Platform** - Works on Windows, macOS, Linux

## API Endpoints

### News Management
- `GET /api/news/fetch?url=<feed_url>` - Fetch news from RSS/JSON feed
- `GET /api/articles` - Get all articles
- `PUT /api/articles/:id/select` - Toggle article selection
- `DELETE /api/articles` - Clear all articles

### Newsletter Management
- `GET /api/newsletters` - Get all newsletters
- `POST /api/newsletters` - Create newsletter
- `PUT /api/newsletters/:id` - Update newsletter
- `GET /api/newsletters/:id` - Get specific newsletter

### Configuration
- `GET /api/settings` - Get current settings
- `POST /api/settings` - Update settings
- `POST /api/test-connection` - Test API connections

### Social Media
- `GET /api/social-media-posts` - Get all social media posts
- `POST /api/social-media-posts` - Create social media posts
- `PUT /api/social-media-posts/:id` - Update post status

## Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with Vite
- **UI**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Forms**: React Hook Form + Zod validation

### Backend (Node.js + Express)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Anthropic Claude SDK
- **Publishing**: Beehiiv API integration
- **Email**: SendGrid integration
- **Scheduling**: Node-cron for automation

### External Services
- **AI**: Anthropic Claude (claude-sonnet-4-20250514)
- **Publishing**: Beehiiv newsletter platform
- **Email**: SendGrid for notifications
- **News Sources**: RSS/Atom/JSON feeds

## Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker (Optional)
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

### Environment Variables for Production
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-...
BEEHIIV_API_KEY=...
```

## Testing

### Mock Database Testing
```bash
USE_MOCK_DB=true npm run dev
```

### API Testing
```bash
# Test news fetching with sample data
curl "http://localhost:5000/api/news/fetch?url=https://example.com/test-feed"

# Test settings
curl "http://localhost:5000/api/settings"
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Set `USE_MOCK_DB=true` for testing
   - Verify PostgreSQL is running
   - Check DATABASE_URL format

2. **API Key Issues**
   - Verify all required API keys are set
   - Check API key permissions
   - Use mock database to test without external APIs

3. **Port Conflicts**
   - Change PORT environment variable
   - Kill processes using port 5000

### Debug Mode
```bash
DEBUG=* npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Use mock database for testing: `USE_MOCK_DB=true`
4. Make your changes
5. Test thoroughly
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions and support:
- Check the GitHub Issues
- Review the troubleshooting section
- Use mock database for testing issues