import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MonteCarloPathsChart = ({ results }) => {
  const [displayPaths, setDisplayPaths] = useState(20);
  const [selectedMetric, setSelectedMetric] = useState('final_value');

  // Validate and process simulation paths
  const simulationPaths = results.simulation_paths || [];

  // Determine chart data
  const chartData = simulationPaths.slice(0, displayPaths).map((path, index) => ({
    name: `Simulation ${index + 1}`,
    ...path
  }));

  // Metrics for dropdown
  const metrics = [
    { value: 'final_value', label: 'Final Portfolio Value' },
    { value: 'total_return', label: 'Total Return (%)' },
    { value: 'max_drawdown', label: 'Max Drawdown (%)' }
  ];

  return (
    <div className="w-full h-[600px] p-4">
      <h2 className="text-xl font-bold mb-4">Monte Carlo Simulation Paths</h2>
      
      <div className="flex items-center mb-4">
        <div className="w-1/2 mr-2">
          <label className="block mb-2">Number of Paths to Display</label>
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={displayPaths}
            onChange={(e) => setDisplayPaths(Number(e.target.value))}
            className="w-full"
          />
          <span className="text-sm">{displayPaths}</span>
        </div>
        
        <div className="w-1/2">
          <label className="block mb-2">Metric</label>
          <select 
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {metrics.map((metric) => (
              <option key={metric.value} value={metric.value}>
                {metric.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <LineChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {chartData.map((path, index) => (
            <Line
              key={`path-${index}`}
              data={path.equity_curve}
              type="monotone"
              dataKey="value"
              stroke={`hsl(${index * 360 / chartData.length}, 70%, 50%)`}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonteCarloPathsChart;