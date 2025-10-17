# O7C Hub

The administrative hub for O7C (Ohio College Coaches) ecosystem, providing coaches and administrators with tools to manage players, teams, and tournaments.

## Features

- **Player Management**: Comprehensive player profiles with contact information, school details, and performance metrics
- **Team Administration**: Create and manage teams, assign coaches, and track team history
- **Tournament Management**: Organize and track tournament participation and results
- **User Management**: Approve new user registrations and manage access controls
- **Recruiting Tools**: Advanced player matching and recruitment workflow
- **Financial Dashboard**: Payment processing and financial reporting
- **Calendar Integration**: Team scheduling and event management

## Tech Stack

- **Frontend**: React 18 with Vite
- **Routing**: React Router v7
- **UI Components**: Custom component library with Tailwind CSS
- **State Management**: React Context API
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **APIs**: Base44, HuggingFace, Brevo (email), Square (payments)
- **Deployment**: Vercel

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project with Firestore enabled

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your actual values

# Start development server
npm run dev
```

### Build

```bash
npm run build
```

### Testing

```bash
npm test
npm run test:ui  # Visual test runner
```

## Environment Variables

See `.env.example` for all required environment variables. Key configurations include:

- **Firebase**: Authentication and database
- **API Keys**: Base44, HuggingFace, Brevo, Square
- **Analytics**: Google Analytics, Sentry, LogRocket (optional)

## Deployment

This application is configured for deployment on Vercel with the following settings:

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x
- **Framework**: Vite (custom configuration)

### Vercel Configuration

The `vercel.json` file includes:
- Custom build settings for monorepo structure
- Security headers and CSP policies
- API function configuration
- Redirect rules for HTTPS enforcement

## Project Structure

```
packages/o7c-hub/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── contexts/      # React contexts
│   ├── utils/         # Utility functions
│   └── lib/           # Library configurations
├── api/               # Vercel serverless functions
├── public/            # Static assets
├── vercel.json        # Vercel deployment config
├── .vercelignore      # Files to exclude from deployment
└── package.json
```

## Contributing

1. Follow the existing code style and patterns
2. Write tests for new features
3. Update documentation as needed
4. Ensure all environment variables are properly documented

## Security

- All API keys are stored server-side only
- Client-side environment variables are prefixed with `VITE_`
- Sensitive operations use serverless functions
- Content Security Policy headers are enforced

## Support

For support or questions, please contact the O7C development team.