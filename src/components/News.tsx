import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper, ExternalLink } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  url: string;
  published_at: string;
  source: {
    title: string;
    domain: string;
  };
}

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const firstItemFetched = useRef(false);
  const navigate = useNavigate();

  const fetchWithRetry = async (url: string, retries = 3, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);

        if (response.status === 429) {
          // If we're out of retries, throw an error
          if (i === retries - 1) {
            throw new Error('Rate limit exceeded. Please try again later.');
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
          continue;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        return await response.json();
      } catch (err) {
        if (i === retries - 1) throw err;
      }
    }
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const data = await fetchWithRetry(
          'https://api.allorigins.win/get?url=' + encodeURIComponent('https://cryptopanic.com/api/v1/posts/?auth_token=9dab69f78b350e06ac97aee9654e25828a969731&currencies=BTC&kind=news')
        );
        const parsedData = JSON.parse(data.contents);
        const results = parsedData.results.slice(0, 5);
        setNews(results);
        setError(null);
        
        // Automatically fetch content for the first news item
        if (results.length > 0 && !firstItemFetched.current) {
          firstItemFetched.current = true;
          handleExternalClick(new MouseEvent('click') as any, results[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load news');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const handleExternalClick = (e: React.MouseEvent, item: NewsItem) => {
    e.preventDefault();
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  const handleTitleClick = (e: React.MouseEvent, item: NewsItem) => {
    e.preventDefault();
    navigate('/news-detail', { state: { title: item.title, url: item.url } });
  };

  const handleFetchAll = async () => {
    for (const item of news) {
      try {
        const response = await fetch('http://localhost:3001/fetch-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: item.url }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }

        const data = await response.json();
        console.log('\n--- Article ---');
        console.log('Title:', item.title);
        console.log('Content:', data.content);
        console.log('Original Source:', data.sourceLink);
      } catch (err) {
        console.error('Failed to get content for:', item.title, err);
      }
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Latest News</h2>
        </div>
        <button
          onClick={handleFetchAll}
          className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Fetch All Content
        </button>
      </div>
      <div className="space-y-3">
        {news.map((item) => (
          <div key={item.url} className="block p-2 rounded-lg hover:bg-gray-50">
            <div className="flex justify-between items-start gap-2">
              <div className="flex items-center gap-2">
                <a 
                  href="#"
                  onClick={(e) => handleTitleClick(e, item)}
                  className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                >
                  {item.title}
                </a>
                <a
                  href="#"
                  onClick={(e) => handleExternalClick(e, item)}
                  className="text-gray-500 hover:text-gray-700"
                  title="Open in CryptoPanic"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {new Date(item.published_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Source:{' '}
              <a
                href={`https://${item.source.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {item.source.title} ({item.source.domain})
              </a>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default News; 