import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';

interface NewsDetailState {
  title: string;
  content: string;
  sourceLink: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const INITIAL_PROMPT = `Analyze this cryptocurrency news article and provide investment advice. Please structure your response in the following format:

1. Key Points:
   - Summarize the main points of the news
   - Identify potential market impact

2. Market Analysis:
   - Current market context
   - Potential short-term effects
   - Long-term implications

3. Risk Assessment:
   - Identify key risks
   - Market sentiment impact
   - Potential counterarguments

4. Investment Recommendation:
   - Clear actionable advice
   - Suggested timeframe
   - Risk management suggestions

5. Additional Considerations:
   - Related market factors
   - Alternative scenarios
   - Key metrics to monitor

Note: This is financial analysis for educational purposes only. Always do your own research and consult with financial advisors before making investment decisions.

News Title: {title}

News Content: {content}`;

const NewsDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as NewsDetailState;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasInitialAnalysis, setHasInitialAnalysis] = useState(false);

  const analyzeNews = async () => {
    if (!state || hasInitialAnalysis) return;

    setIsAnalyzing(true);
    try {
      const prompt = INITIAL_PROMPT
        .replace('{title}', state.title)
        .replace('{content}', state.content);

      const response = await fetch('http://localhost:3001/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze news');
      }

      const data = await response.json();
      setMessages([{ role: 'assistant', content: data.analysis }]);
      setHasInitialAnalysis(true);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage = { role: 'user' as const, content: newMessage };
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    try {
      const response = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context: `This is a conversation about the following crypto news article:
Title: ${state.title}
Content: ${state.content}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  // Start analysis when component mounts
  useEffect(() => {
    analyzeNews();
  }, []); // Empty dependency array for component mount

  if (!state) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-red-500">
          Invalid news item
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
          {state.content}
        </div>

        {state.sourceLink && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <a
              href={state.sourceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              Read original article
            </a>
          </div>
        )}
      </div>

      <div className="mt-8 border-t pt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          AI Analysis & Discussion
        </h2>
        
        <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
          {isAnalyzing ? (
            <div className="animate-pulse text-gray-500">
              Analyzing news and generating investment insights...
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.role === 'assistant'
                    ? 'bg-blue-50 text-gray-800'
                    : 'bg-gray-50 text-gray-800'
                }`}
              >
                <div className="text-xs text-gray-500 mb-1">
                  {message.role === 'assistant' ? 'AI Analysis' : 'You'}
                </div>
                <div className="whitespace-pre-line">{message.content}</div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask follow-up questions about the analysis..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsDetail; 