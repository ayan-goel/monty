import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Grid, Typography, Card, CardContent } from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  TrendingUp, 
  TrendingDown, 
  Timeline,
  Assessment,
  Speed,
  AttachMoney,
  ShowChart,
  Percent
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StatCard = styled(Card)(({ theme }) => ({
  height: '100%',
  minHeight: '300px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
  '& .MuiCardContent-root': {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(3),
  },
}));

const StatHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  padding: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
    fontSize: '1.75rem',
  },
  '& .MuiTypography-root': {
    fontSize: '1.25rem',
    fontWeight: 600,
  },
}));

const StatValue = styled(Typography)(({ positive, theme }) => ({
  fontSize: '2rem',
  fontWeight: 700,
  color: positive ? theme.palette.success.main : theme.palette.error.main,
}));

const StatItem = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.default,
  '& .stat-label': {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  '& .stat-value': {
    fontSize: '1.5rem',
    fontWeight: 700,
  },
}));

const BacktestResults = () => {
  const location = useLocation();
  const results = location.state?.results;

  if (!results) {
    return <Typography>No results available</Typography>;
  }

  const chartData = {
    labels: Array.from({ length: results.equity_curve.length }, (_, i) => i + 1),
    datasets: [
      {
        label: 'Portfolio Value',
        data: results.equity_curve,
        borderColor: 'rgba(33, 150, 243, 1)',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <Box sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Performance Overview */}
        <Grid item xs={12}>
          <StatCard>
            <CardContent>
              <StatHeader>
                <ShowChart />
                <Typography variant="h6">Performance Overview</Typography>
              </StatHeader>
              <Box sx={{ height: '400px' }}>
                <Line data={chartData} options={chartOptions} />
              </Box>
            </CardContent>
          </StatCard>
        </Grid>

        {/* Key Statistics */}
        <Grid item xs={12} md={6}>
          <StatCard>
            <CardContent>
              <StatHeader>
                <Assessment />
                <Typography variant="h6">Key Statistics</Typography>
              </StatHeader>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <StatItem>
                    <Typography className="stat-label">
                      Total Return
                    </Typography>
                    <StatValue positive={results.total_return_pct > 0}>
                      {results.total_return_pct.toFixed(2)}%
                    </StatValue>
                  </StatItem>
                </Grid>
                <Grid item xs={6}>
                  <StatItem>
                    <Typography className="stat-label">
                      Initial Capital
                    </Typography>
                    <Typography className="stat-value" color="primary">
                      ${results.initial_capital.toLocaleString()}
                    </Typography>
                  </StatItem>
                </Grid>
                <Grid item xs={6}>
                  <StatItem>
                    <Typography className="stat-label">
                      Final Capital
                    </Typography>
                    <Typography className="stat-value" color="primary">
                      ${results.final_capital.toLocaleString()}
                    </Typography>
                  </StatItem>
                </Grid>
                <Grid item xs={6}>
                  <StatItem>
                    <Typography className="stat-label">
                      Max Drawdown
                    </Typography>
                    <Typography className="stat-value" color="error">
                      {results.max_drawdown_pct.toFixed(2)}%
                    </Typography>
                  </StatItem>
                </Grid>
                <Grid item xs={6}>
                  <StatItem>
                    <Typography className="stat-label">
                      Win Rate
                    </Typography>
                    <Typography className="stat-value" color="primary">
                      {results.win_rate.toFixed(2)}%
                    </Typography>
                  </StatItem>
                </Grid>
              </Grid>
            </CardContent>
          </StatCard>
        </Grid>

        {/* Trade Analysis */}
        <Grid item xs={12} md={6}>
          <StatCard>
            <CardContent>
              <StatHeader>
                <Timeline />
                <Typography variant="h6">Trade Analysis</Typography>
              </StatHeader>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <StatItem>
                    <Typography className="stat-label">
                      Total Trades
                    </Typography>
                    <Typography className="stat-value">
                      {results.total_trades}
                    </Typography>
                  </StatItem>
                </Grid>
                <Grid item xs={6}>
                  <StatItem>
                    <Typography className="stat-label">
                      Winning Trades
                    </Typography>
                    <Typography className="stat-value" color="success.main">
                      {results.winning_trades}
                    </Typography>
                  </StatItem>
                </Grid>
                <Grid item xs={6}>
                  <StatItem>
                    <Typography className="stat-label">
                      Average Profit
                    </Typography>
                    <Typography className="stat-value" color="success.main">
                      ${results.avg_profit.toFixed(2)}
                    </Typography>
                  </StatItem>
                </Grid>
                <Grid item xs={6}>
                  <StatItem>
                    <Typography className="stat-label">
                      Average Loss
                    </Typography>
                    <Typography className="stat-value" color="error.main">
                      ${Math.abs(results.avg_loss).toFixed(2)}
                    </Typography>
                  </StatItem>
                </Grid>
              </Grid>
            </CardContent>
          </StatCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BacktestResults; 