import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface NewsDetailState {
  title: string;
  url: string;
}

const NewsDetail = () => {
  const [content, setContent] = useState<string>('');
  const [sourceLink, setSourceLink] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as NewsDetailState;

  useEffect(() => {
    const fetchContent = async () => {
      if (!state?.url) {
        setError('No URL provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3001/fetch-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: state.url }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }

        const data = await response.json();
        setContent(data.content);
        setSourceLink(data.sourceLink);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [state?.url]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-red-500">
          {error || 'Invalid news item'}
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to news
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={() => navigate('/')}
        className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to news
      </button>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        {state.title}
      </h1>

      <div className="prose prose-sm max-w-none">
        <div className="mb-6 text-gray-700 whitespace-pre-line">
          {content}
        </div>

        {sourceLink && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <a
              href={sourceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              Read original article
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsDetail; 