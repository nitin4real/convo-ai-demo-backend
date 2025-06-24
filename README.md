# ConvoAI Backend

A comprehensive backend service for managing conversational AI agents with real-time voice capabilities, built with Node.js, TypeScript, and Express.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Agent System](#agent-system)
- [Adding New Agents](#adding-new-agents)
- [Agent Configuration](#agent-configuration)
- [Development](#development)
- [Contributing](#contributing)

## Overview

ConvoAI Backend is a conversational AI platform that enables real-time voice interactions with specialized AI agents. The system supports multiple agent types including astrology, education, wellness, language learning, and more. Each agent is designed with specific expertise and personality traits to provide engaging and helpful conversations.

### Key Components

- **Agent Management**: Dynamic agent creation and configuration
- **Real-time Communication**: WebRTC-based voice conversations
- **Multi-language Support**: Agents can communicate in multiple languages
- **Voice Synthesis**: Integration with ElevenLabs and Microsoft TTS
- **User Management**: Authentication and user session management
- **Database Integration**: PostgreSQL with TypeORM for data persistence

## Features

- 🎯 **Specialized AI Agents**: Domain-specific agents with unique personalities
- 🗣️ **Real-time Voice Conversations**: WebRTC-based audio communication
- 🌍 **Multi-language Support**: Agents can speak multiple languages
- 🎨 **Customizable Voices**: Integration with ElevenLabs and Azure TTS
- 🔐 **Secure Authentication**: JWT-based user authentication
- 📊 **User Analytics**: Track conversation minutes and usage
- 🚀 **Scalable Architecture**: Microservices-ready design
- 🔧 **Easy Configuration**: Simple agent and system configuration

## Architecture

```
src/
├── app.ts                 # Main application entry point
├── config/               # Configuration files
│   └── database.ts       # Database configuration
├── data/                 # Static data and agent definitions
│   └── agents.ts         # Agent configurations and types
├── middleware/           # Express middleware
├── models/              # Database models
├── routes/              # API route handlers
│   ├── agent.ts         # Agent management endpoints
│   ├── auth.ts          # Authentication endpoints
│   ├── users.ts         # User management endpoints
│   └── ...
├── services/            # Business logic services
│   ├── agentService.ts  # Agent lifecycle management
│   ├── agentPromptService.ts # Agent prompt generation
│   └── ...
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Docker (optional)
- Agora.io account and credentials
- ElevenLabs API key (for voice synthesis)
- OpenAI API key (for LLM integration)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd convoai-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following environment variables:
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=convoai_db
   
   # Agora.io
   AGORA_APP_ID=your_agora_app_id
   AGORA_CUSTOMER_ID=your_customer_id
   AGORA_CUSTOMER_SECRET=your_customer_secret
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_API_URL=https://api.openai.com/v1/chat/completions
   
   # ElevenLabs
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   
   # Azure TTS (optional)
   AZURE_TTS_KEY=your_azure_tts_key
   AZURE_TTS_REGION=eastus
   
   # JWT
   JWT_SECRET=your_jwt_secret
   
   # Server
   PORT=3000
   PROD=false
   ```

4. **Set up database**
   ```bash
   # Using Docker
   docker-compose up -d db
   
   # Or install PostgreSQL locally
   # Then run migrations
   npm run build
   npm start
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DB_HOST` | PostgreSQL host | Yes | - |
| `DB_PORT` | PostgreSQL port | No | 5432 |
| `DB_USER` | Database username | Yes | - |
| `DB_PASSWORD` | Database password | Yes | - |
| `DB_NAME` | Database name | Yes | - |
| `AGORA_APP_ID` | Agora.io application ID | Yes | - |
| `AGORA_CUSTOMER_ID` | Agora.io customer ID | Yes | - |
| `AGORA_CUSTOMER_SECRET` | Agora.io customer secret | Yes | - |
| `OPENAI_API_KEY` | OpenAI API key | Yes | - |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `PORT` | Server port | No | 3000 |
| `PROD` | Production mode | true | false |

## API Documentation

### Authentication Endpoints

#### POST `/api/auth/login`
Authenticate a user and return JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "remainingMinutes": 100
  }
}
```

### Agent Endpoints

#### GET `/api/agent/agents`
Get list of all available agents.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": "astra",
    "name": "Astra",
    "title": "The Astrologer",
    "introduction": "Hello, I'm Astra...",
    "description": "Astra, the celestial guide...",
    "features": ["Birth chart analysis", "Daily horoscopes"],
    "voiceId": "gOkFV1JMCt0G0n9xmBwV",
    "type": "astrology",
    "domain": "Astrology"
  }
]
```

#### GET `/api/agent/agents/:type`
Get agents filtered by type.

#### POST `/api/agent/start/:agentId`
Start an agent in a channel.

**Request Body:**
```json
{
  "channelName": "my-channel",
  "languageCode": "en-US"
}
```

**Response:**
```json
{
  "agent_id": "convo_agent_id",
  "token": "agora_token",
  "channel": "my-channel",
  "uid": 101
}
```

#### POST `/api/agent/stop`
Stop the currently active agent.

#### GET `/api/agent/:agentUid/status`
Get the status of an agent.

#### POST `/api/agent/heartbeat/:convoAgentId`
Send heartbeat to keep agent alive.

## Agent System

The agent system is the core component of ConvoAI, allowing for dynamic creation and management of specialized AI personalities.

### Agent Types

The system supports the following agent types:

- **Astrology** (`astrology`): Astrological guidance and horoscopes
- **Edtech** (`edtech`): Educational content and tutoring
- **Social** (`social`): Social media and communication
- **Interview** (`interview`): Interview preparation and coaching
- **Companion** (`companion`): Friendly conversation and support
- **Religion** (`religion`): Religious guidance and spiritual support
- **Wellness** (`wellness`): Health and wellness advice
- **Language** (`language`): Language learning and practice
- **Advisor** (`advisor`): General advice and guidance
- **Misc** (`misc`): Miscellaneous topics and general conversation

### Agent Domains

Each agent belongs to a specific domain that defines their expertise:

- Astrology, Mathematics, Therapy, Cooking, History
- Finance, Spirituality, Tarot Reader, Lal Kitab
- Gemstone, General Teaching, Social, Interview
- Wellness, Diet and Fitness, Language Learning
- Religion (Hinduism, Sikhism, Islam, Christianity)
- Travel, Sports, and more

## Adding New Agents

### Step 1: Define Agent Configuration

Add your new agent to the `agents` array in `src/data/agents.ts`:

```typescript
{
  id: 'your-agent-id',
  name: 'Agent Name',
  title: 'The Agent Title',
  introduction: 'Hello, I\'m [Name], your introduction here...',
  description: 'Detailed description of what this agent does...',
  features: [
    'Feature 1',
    'Feature 2',
    'Feature 3'
  ],
  voiceId: 'elevenlabs_voice_id', // Optional
  type: AgentTypeIds.YourType, // Choose from existing types
  domain: AgentDomains.YourDomain, // Choose from existing domains
  languages: [ // Optional - for multi-language support
    {
      name: 'English',
      isoCode: 'en-US',
      introduction: 'English introduction...'
    },
    {
      name: 'Hindi',
      isoCode: 'hi-IN', 
      introduction: 'Hindi introduction...'
    }
  ],
  layout: Layout.DEFAULT, // Optional - UI layout preference
  isCustomLLM: false // Optional - use custom LLM endpoint
}
```

### Step 2: Add Custom Instructions (Optional)

If your agent needs custom behavior, add instructions to the `customInstructions` object:

```typescript
'your-agent-id': {
  instructions: `
    You are [Agent Name], a [role/description].
    
    Your specific instructions here:
    - Behave in a specific way
    - Use particular language or tone
    - Follow specific guidelines
    
    Additional context and personality traits...
  `,
  dismissDefaultInstructions: false // Set to true to override default prompts
}
```

### Step 3: Add New Agent Type (If Needed)

If your agent doesn't fit existing types, add a new type:

1. Add to `AgentTypeIds` enum:
```typescript
const enum AgentTypeIds {
  // ... existing types
  YourNewType = 'your-new-type',
}
```

2. Add to `AgentDomains` enum:
```typescript
const enum AgentDomains {
  // ... existing domains
  YourNewDomain = 'Your New Domain',
}
```

3. Add to `agentTypes` array:
```typescript
{
  id: AgentTypeIds.YourNewType,
  title: 'Your New Type',
  description: 'Description of this agent type...'
}
```

### Step 4: Test Your Agent

1. Restart the development server
2. Test the agent via API endpoints
3. Verify voice synthesis works correctly
4. Test multi-language support if applicable

## Agent Configuration

### Voice Configuration

Agents can use different voice synthesis providers:

#### ElevenLabs (Default)
```typescript
{
  vendor: "elevenlabs",
  params: {
    key: process.env.ELEVENLABS_API_KEY,
    model_id: "eleven_flash_v2_5",
    voice_id: "your_voice_id",
    stability: 1,
    similarity_boost: 0.75,
    adjust_volume: 1000
  }
}
```

#### Microsoft Azure TTS
```typescript
{
  vendor: "microsoft",
  params: {
    key: process.env.AZURE_TTS_KEY,
    region: process.env.AZURE_TTS_REGION,
    voice_name: "en-US-AndrewMultilingualNeural"
  }
}
```

### Language Support

To add multi-language support to an agent:

```typescript
languages: [
  {
    name: 'English',
    isoCode: 'en-US',
    introduction: 'English introduction...'
  },
  {
    name: 'Hindi',
    isoCode: 'hi-IN',
    introduction: 'Hindi introduction...'
  },
  {
    name: 'Spanish',
    isoCode: 'es-ES',
    introduction: 'Spanish introduction...'
  }
]
```

### Custom LLM Integration

For agents that need custom LLM endpoints:

```typescript
{
  id: 'custom-agent',
  // ... other properties
  isCustomLLM: true
}
```

This will use the `CUSTOM_LLM_ENDPOINT` environment variable and generate a JWT token for authentication.

### Layout Options

Agents can specify different UI layouts:

- `Layout.DEFAULT`: Standard conversation interface
- `Layout.METADATA_TRANSCRIPT`: Interface with metadata and transcript display

## Development

### Project Structure

```
src/
├── app.ts                 # Main application entry point
├── config/               # Configuration files
├── data/                 # Static data and agent definitions
├── middleware/           # Express middleware
├── models/              # Database models
├── routes/              # API route handlers
├── services/            # Business logic services
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

### Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build TypeScript to JavaScript
- `npm start`: Start production server
- `npm test`: Run tests (not implemented yet)

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add proper error handling
- Include JSDoc comments for public APIs
- Use async/await for asynchronous operations

### Database Migrations

The project uses TypeORM for database management. To create migrations:

```bash
# Generate migration
npm run typeorm migration:generate -- -n MigrationName

# Run migrations
npm run typeorm migration:run

# Revert migrations
npm run typeorm migration:revert
```

## Deployment

### Docker Deployment

1. Build the Docker image:
```bash
docker build -t convoai-backend .
```

2. Run with Docker Compose:
```bash
docker-compose up -d
```

### Environment Setup

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-agent`
3. Make your changes following the coding standards
4. Add tests for new functionality
5. Update documentation as needed
6. Submit a pull request

### Guidelines

- Follow the existing code structure and patterns
- Add proper error handling and validation
- Include TypeScript types for all new interfaces
- Test your changes thoroughly
- Update this documentation for any new features

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions
