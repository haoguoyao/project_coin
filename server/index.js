const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(express.static(path.join(__dirname, 'dist')));

const port = process.env.PORT || 3001;  // Elastic Beanstalk will set PORT env variable
const API_KEY = process.env.CRYPTOPANIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error('CRYPTOPANIC_API_KEY is not set in .env file');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set in .env file');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

const db = new sqlite3.Database(path.join(__dirname, 'news.db'));

// Initialize database
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      published_at DATETIME NOT NULL,
      cryptopanic_url TEXT UNIQUE NOT NULL,
      source_link TEXT,
      source_title TEXT,
      source_domain TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Add static file serving for production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Update CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? false  // Disable CORS in production since we're serving from same domain
    : 'http://localhost:5173'
}));

app.use(express.json());

async function fetchAndSaveLatestNews() {
  let browser = null;
  try {
    console.log('Fetching latest news...');
    
    // Fetch the latest news from CryptoPanic
    const response = await fetch(
      `https://cryptopanic.com/api/v1/posts/?auth_token=${API_KEY}&currencies=BTC&kind=news&limit=10`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch news list');
    }

    const data = await response.json();
    const newsItems = data.results;

    const puppeteer = require('puppeteer-extra');
    const StealthPlugin = require('puppeteer-extra-plugin-stealth');
    
    puppeteer.use(StealthPlugin());
    
    const browser = await puppeteer.launch({
      headless: true, // or true if you still want to be headless
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Create a single page to reuse
    const page = await browser.newPage();

    // Process each news item sequentially
    for (const item of newsItems) {
      try {
        console.log(`Processing news: ${item.title} ${item.url}`);
        await page.goto(item.url, { waitUntil: 'networkidle0' });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Wait for and extract the content
        await page.waitForSelector('.description-body', { timeout: 10000 });
        await page.waitForSelector('.post-title a[target="_blank"]', { timeout: 10000 });


        // Extract the content and source link
        const result = await page.evaluate(() => {
          const contentElement = document.querySelector('.description-body');
          const sourceLinkElement = document.querySelector('.post-title a[target="_blank"]');
          
          return {
            content: contentElement ? contentElement.innerText : null,
            sourceLink: sourceLinkElement ? sourceLinkElement.href : null
          };
        });
        //print content
        // console.log(`Content: ${result.content}`);
        // console.log(`Source link: ${result.sourceLink}`);

        // Insert into database
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT OR IGNORE INTO news (
              title, content, published_at, cryptopanic_url, source_link, 
              source_title, source_domain
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            item.title,
            result.content,
            item.published_at,
            item.url,
            result.sourceLink,
            item.source.title,
            item.source.domain
          ], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        console.log(`Successfully processed: ${item.title}`);
      } catch (err) {
        console.error(`Failed to fetch content for: ${item.title}`, err.message);
      }
    }

    // Close the single page
    await page.close();
    console.log('News updated in database');
  } catch (error) {
    console.error('Error in fetchAndSaveLatestNews:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

app.get('/latest-news', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  db.all(`
    SELECT * FROM news 
    ORDER BY published_at DESC 
    LIMIT ? OFFSET ?
  `, [limit, offset], (err, rows) => {
    if (err) {
      console.error('Error reading news data:', err);
      return res.status(500).json({ error: 'Failed to fetch news data' });
    }
    res.json(rows);
  });
});

// Add OpenAI endpoints
app.post('/analyze', async (req, res) => {
  try {
    const { prompt } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a cryptocurrency market analyst providing investment insights based on news. Your analysis should be very concise."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    res.json({ analysis: completion.choices[0].message.content });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to analyze news' });
  }
});

app.post('/chat', async (req, res) => {
  try {
    const { messages, context } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a cryptocurrency market analyst having a conversation about a news article. 
                   Provide very consice responses while maintaining context of the discussion.
                   
                   Context:
                   ${context}`
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to get response' });
  }
});

// Call the function when server starts
fetchAndSaveLatestNews();

// Schedule to run every hour
setInterval(fetchAndSaveLatestNews, 60 * 60 * 1000);

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 