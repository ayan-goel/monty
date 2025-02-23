import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Box } from '@mui/material';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Chart = ({ data }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (data?.returns) {
      data.returns.forEach((value, index) => {
        if (index > 0 && value < data.returns[index - 1]) {
          console.warn(`Decrease detected at index ${index}:`, {
            date: data.dates[index],
            previousValue: data.returns[index - 1],
            currentValue: value,
            difference: value - data.returns[index - 1]
          });
        }
      });
    }
  }, [data]);

  const sortedData = React.useMemo(() => {
    if (!data?.dates || !data?.returns) return data;
    
    const pairs = data.dates.map((date, index) => ({
      date,
      value: data.returns[index]
    }));
    
    pairs.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return {
      dates: pairs.map(p => p.date),
      returns: pairs.map(p => p.value)
    };
  }, [data]);

  const chartData = {
    labels: sortedData.dates,
    datasets: [
      {
        label: 'Portfolio Value',
        data: sortedData.returns,
        fill: true,
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderColor: 'rgba(33, 150, 243, 1)',
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: 'rgba(33, 150, 243, 1)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#2C3E50',
        bodyColor: '#2C3E50',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            return `$${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          display: false,
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#7F8C8D',
          callback: (value) => `$${value.toFixed(0)}`
        }
      }
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Line data={chartData} options={options} />
    </Box>
  );
};

export default Chart;