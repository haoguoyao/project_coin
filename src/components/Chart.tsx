import { useEffect, useRef } from 'react';
import { createChart, type IChartApi,UTCTimestamp } from 'lightweight-charts';
import type { FormattedCandleData } from '../types';

interface ChartProps {
  data: FormattedCandleData[];
  loading: boolean;
}

const Chart = ({ data, loading }: ChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    candlestickSeries.setData(data.map(item => ({
      ...item,
      time: item.time as UTCTimestamp
    })));
    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data]);

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-white">
        <p className="text-gray-500">Loading chart data...</p>
      </div>
    );
  }

  return <div ref={chartContainerRef} className="w-full h-[400px]" />;
};

export default Chart;