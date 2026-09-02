# DEC Photobooth

A modern web-based photobooth platform built with React and Node.js. Capture memorable moments with filters, frames, and photo strips.

## Features

- Camera capture with front/back switching
- Multiple photo strip layouts (Classic, Grid, Film Strip, Polaroid)
- Live filters and effects
- Custom frames and backgrounds
- Download and share photos
- Email photo strips directly
- Mobile-first responsive design
- PWA support (installable on iOS/Android)

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Email**: Nodemailer (Gmail SMTP)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (optional - works without backend)
- Gmail app password for email (optional)

### Installation

1. Install frontend dependencies:
```bash
cd client
npm install
```

2. Install backend dependencies:
```bash
cd server
npm install
```

3. Set up environment variables:
```bash
cd server
cp .env.example .env
# Edit .env with your credentials
```

4. Start the development servers:

Frontend:
```bash
cd client
npm run dev
```

Backend:
```bash
cd server
npm run dev
```

5. Open http://localhost:5173 in your browser

## Project Structure

```
photobooth/
├── client/                  # React frontend
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   ├── utils/           # Utility functions
│   │   └── App.jsx          # Main app
│   └── package.json
├── server/                  # Node.js backend
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── middleware/           # Express middleware
│   └── index.js             # Server entry
├── database/                # SQL schemas
└── README.md
```

## Environment Variables

### Server (.env)

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=xxxx-xxxx-xxxx-xxxx
PORT=3001
CLIENT_URL=http://localhost:5173
```

### Client (.env)

```env
VITE_API_URL=http://localhost:3001
```

## Database Setup

1. Create a Supabase project at https://supabase.com
2. Run the SQL schema from `database/schema.sql` in the SQL editor
3. Copy the project URL and keys to your `.env` file

## PWA Installation

- **iOS**: Open in Safari, tap Share, then "Add to Home Screen"
- **Android**: Open in Chrome, tap the install banner or menu > "Install app"
- **Desktop**: Click the install icon in the address bar

## License

MIT
