const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

async function fetchAndSaveLatestNews() {
  let browser = null;
  try {
    console.log('Fetching latest news...');
    
    // Fetch the latest news from CryptoPanic
    const response = await fetch(
      'https://cryptopanic.com/api/v1/posts/?auth_token=9dab69f78b350e06ac97aee9654e25828a969731&currencies=BTC&kind=news&limit=10'
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch news list');
    }

    const data = await response.json();
    const newsItems = data.results;

    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const newsWithContent = [];

    // Process each news item
    for (const item of newsItems) {
      try {
        const page = await browser.newPage();
        await page.goto(item.url, { waitUntil: 'networkidle0' });

        // Wait for and extract the content
        await page.waitForSelector('.description-body', { timeout: 5000 });

        // Extract the content and source link
        const result = await page.evaluate(() => {
          const contentElement = document.querySelector('.description-body');
          const sourceLinkElement = document.querySelector('.post-title a');
          
          return {
            content: contentElement ? contentElement.innerText : null,
            sourceLink: sourceLinkElement ? sourceLinkElement.href : null
          };
        });

        newsWithContent.push({
          title: item.title,
          published_at: item.published_at,
          cryptopanic_url: item.url,
          content: result.content,
          source_link: result.sourceLink,
          source: {
            title: item.source.title,
            domain: item.source.domain
          }
        });

        await page.close();
      } catch (err) {
        console.error(`Failed to fetch content for: ${item.title}`, err.message);
      }
    }

    // Save to file
    const filePath = path.join(__dirname, 'latest_news.json');
    
    await fs.writeFile(
      filePath,
      JSON.stringify(newsWithContent, null, 2),
      'utf8'
    );

    console.log(`Saved ${newsWithContent.length} news items to ${filePath}`);
  } catch (error) {
    console.error('Error in fetchAndSaveLatestNews:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

app.post('/fetch-content', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Wait for the content to load
    await page.waitForSelector('.description-body', { timeout: 5000 });

    // Extract the content
    const content = await page.evaluate(() => {
      const contentElement = document.querySelector('.description-body');
      return contentElement ? contentElement.innerText : null;
    });

    // Extract the original source link
    const sourceLink = await page.evaluate(() => {
      const linkElement = document.querySelector('.post-title a');
      return linkElement ? linkElement.href : null;
    });

    await browser.close();

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json({ content, sourceLink });
  } catch (error) {
    console.error('Error:', error);
    if (browser) await browser.close();
    res.status(500).json({ error: error.message });
  }
});

// Call the function when server starts
fetchAndSaveLatestNews();

// Schedule to run every hour
setInterval(fetchAndSaveLatestNews, 60 * 60 * 1000);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 