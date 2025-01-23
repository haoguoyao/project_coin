# Bitcoin Price & News Tracker

A real-time Bitcoin price tracking application with latest crypto news integration. Built with React, TypeScript, and TailwindCSS.

## Features

- **Real-time Bitcoin Price Chart**
  - Hourly price data for the last 30 days
  - Interactive candlestick chart
  - Price data provided by OKX API

- **Crypto News Integration**
  - Latest news from CryptoPanic
  - Click news title to read full content
  - External links to original sources
  - Automatic content fetching for quick preview
  - "Fetch All" functionality to get all news content at once
  - Automatic hourly archiving of latest 10 news items with full content

## Tech Stack

- React
- TypeScript
- TailwindCSS
- React Router DOM
- Express (backend server)
- Puppeteer (for news content scraping)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd server
npm install
```

## Running the Application

1. Start the backend server:
```bash
cd server
npm start
```
The server will run on `http://localhost:3001`

2. In a new terminal, start the frontend application:
```bash
npm start
```
The application will run on `http://localhost:3000`

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── Chart.tsx        # Bitcoin price chart component
│   │   ├── News.tsx         # News list component
│   │   └── NewsDetail.tsx   # Individual news view component
│   ├── App.tsx              # Main application component
│   └── types.ts             # TypeScript type definitions
│
└── server/
    ├── index.js             # Express server for news content fetching
    └── latest_news.json     # Latest archived news data
```

## API Integration

- **OKX API**: Used for fetching Bitcoin price data
- **CryptoPanic API**: Used for fetching crypto news
  - Requires authentication token
  - Rate-limited with retry mechanism
  - Uses AllOrigins proxy to handle CORS
  - Endpoint: `https://api.allorigins.win/get?url=<encoded-url>`

## Features in Detail

### Bitcoin Price Chart
- Displays hourly candlestick data
- Shows price movements over the last 30 days
- Includes volume information

### News Section
- Displays the latest 5 crypto news items
- Each news item shows:
  - Title
  - Source
  - Publication date
  - Link to original source
- Click on title to view detailed content
- Click on external link icon to visit CryptoPanic

## Contributing

Feel free to submit issues and enhancement requests.

## License

[MIT License](LICENSE)

## Acknowledgments

- OKX API for price data
- CryptoPanic for news data
- All open-source libraries used in this project 