import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Bitcoin } from 'lucide-react';
import Chart from './components/Chart';
import News from './components/News';
import NewsDetail from './components/NewsDetail';
import type { FormattedCandleData } from './types';

function App() {
  const [candleData, setCandleData] = useState<FormattedCandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          'https://www.okx.com/api/v5/market/history-candles?instId=BTC-USDT&bar=1H&limit=720',
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const responseData = await response.json();
        const candleData = responseData.data;

        const formattedData: FormattedCandleData[] = candleData
          .map(([timestamp, open, high, low, close, volume]: string[]) => ({
            time: parseInt(timestamp) / 1000,
            open: parseFloat(open),
            high: parseFloat(high),
            low: parseFloat(low),
            close: parseFloat(close),
            volume: parseFloat(volume)
          }))
          .sort((a: FormattedCandleData, b: FormattedCandleData) => 
            (a.time as number) - (b.time as number)
          );

        // Remove duplicates by keeping only the latest entry for each timestamp
        const uniqueData = Array.from(
          new Map(formattedData.map(item => [item.time, item])).values()
        );

        setCandleData(uniqueData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const HomePage = () => (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bitcoin className="w-8 h-8 text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-900">Bitcoin Price Chart</h1>
          </div>

          {error ? (
            <div className="text-red-500 p-4 rounded-lg bg-red-50 mb-4">
              Error: {error}
            </div>
          ) : (
            <Chart data={candleData} loading={loading} />
          )}

          <div className="mt-8 border-t pt-6">
            <News />
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Showing hourly price data for the last 30 days. Data provided by OKX API.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/news-detail" element={<NewsDetail />} />
      </Routes>
    </Router>
  );
}

export default App;