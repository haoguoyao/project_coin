import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper, ExternalLink } from 'lucide-react';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  published_at: string;
  cryptopanic_url: string;
  source_link: string;
  source_title: string;
  source_domain: string;
}

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const navigate = useNavigate();

  const lastNewsElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const fetchNews = async (pageNum: number) => {
    try {
      const response = await fetch(`http://localhost:3001/latest-news?page=${pageNum}&limit=5`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      setHasMore(data.length > 0);
      setNews(prev => pageNum === 1 ? data : [...prev, ...data]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchNews(page);
  }, [page]);

  const handleExternalClick = (e: React.MouseEvent, item: NewsItem) => {
    e.preventDefault();
    window.open(item.cryptopanic_url, '_blank', 'noopener,noreferrer');
  };

  const handleTitleClick = (e: React.MouseEvent, item: NewsItem) => {
    e.preventDefault();
    navigate('/news-detail', { 
      state: { 
        title: item.title,
        content: item.content,
        sourceLink: item.source_link
      } 
    });
  };

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Latest News</h2>
        </div>
      </div>
      <div className="h-[400px] overflow-y-auto pr-2 space-y-3">
        {news.map((item, index) => (
          <div 
            key={item.cryptopanic_url} 
            ref={index === news.length - 1 ? lastNewsElementRef : null}
            className="block p-2 rounded-lg hover:bg-gray-50"
          >
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
                href={`https://${item.source_domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {item.source_title} ({item.source_domain})
              </a>
            </p>
          </div>
        ))}
        {loading && (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default News; 