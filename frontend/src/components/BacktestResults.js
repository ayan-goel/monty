import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Fade,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Timeline,
  Assessment,
  ArrowBack,
  ShowChart,
  Speed,
  Analytics
} from '@mui/icons-material';
import Chart from './Chart';

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  },
}));

const StatValue = styled(Typography)(({ theme, positive }) => ({
  fontSize: '2rem',
  fontWeight: 700,
  color: positive ? theme.palette.success.main : theme.palette.error.main,
  background: positive ? 
    `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.light})` :
    `linear-gradient(45deg, ${theme.palette.error.main}, ${theme.palette.error.light})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}));

const GradientChip = styled(Chip)(({ theme, color = 'primary' }) => ({
  background: `linear-gradient(45deg, ${theme.palette[color].main}, ${theme.palette[color].light})`,
  color: 'white',
  fontWeight: 500,
}));

const AnimatedSection = styled(Box)(({ theme, delay = 0 }) => ({
  opacity: 0,
  transform: 'translateY(20px)',
  animation: `fadeIn 0.5s ease ${delay}s forwards`,
  '@keyframes fadeIn': {
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
}));

const ChartContainer = styled(Box)(({ theme }) => ({
  height: '500px',
  width: '100%',
  padding: theme.spacing(2),
}));

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
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.state?.results) {
      // Simulate loading for smoother transitions
      setTimeout(() => {
        setResults(location.state.results);
        setLoading(false);
      }, 1000);
    } else {
      navigate('/');
    }
  }, [location, navigate]);

  if (loading) {
    return (
      <Box sx={{ mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          Analyzing backtest results...
        </Typography>
      </Box>
    );
  }

  if (!results) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          No results available
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          startIcon={<ArrowBack />}
          sx={{ mt: 2 }}
        >
          Create New Strategy
        </Button>
      </Box>
    );
  }

  const isPositive = results.statistics.total_return > 0;

  return (
    <Box sx={{ py: 4 }}>
      <AnimatedSection>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 4,
          background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
          borderRadius: 2,
          padding: 2,
          color: 'white'
        }}>
          <IconButton onClick={() => navigate('/')} sx={{ mr: 2, color: 'white' }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Backtest Results
          </Typography>
        </Box>
      </AnimatedSection>

      <Grid container spacing={3}>
        {/* Main Chart */}
        <Grid item xs={12}>
          <AnimatedSection delay={0.2}>
            <StyledCard>
              <ChartContainer>
                <Chart data={results} />
              </ChartContainer>
            </StyledCard>
          </AnimatedSection>
        </Grid>

        {/* Key Statistics */}
        <Grid item xs={12} md={6}>
          <AnimatedSection delay={0.4}>
            <StatCard>
              <CardContent>
                <StatHeader>
                  <Assessment />
                  <Typography variant="h6">Key Statistics</Typography>
                </StatHeader>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <StatItem>
                      <Typography className="stat-label">
                        Total Return
                      </Typography>
                      <StatValue 
                        positive={results.statistics.total_return > 0}
                        className="stat-value"
                      >
                        {results.statistics.total_return.toFixed(2)}%
                      </StatValue>
                    </StatItem>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <StatItem>
                      <Typography className="stat-label">
                        Sharpe Ratio
                      </Typography>
                      <Typography className="stat-value" color="primary">
                        {results.statistics.sharpe_ratio.toFixed(2)}
                      </Typography>
                    </StatItem>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <StatItem>
                      <Typography className="stat-label">
                        Max Drawdown
                      </Typography>
                      <Typography className="stat-value" color="error">
                        {results.statistics.max_drawdown.toFixed(2)}%
                      </Typography>
                    </StatItem>
                  </Grid>
                </Grid>
              </CardContent>
            </StatCard>
          </AnimatedSection>
        </Grid>

        {/* Trade Analysis */}
        <Grid item xs={12} md={6}>
          <AnimatedSection delay={0.6}>
            <StatCard>
              <CardContent>
                <StatHeader>
                  <Analytics />
                  <Typography variant="h6">Trade Analysis</Typography>
                </StatHeader>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <StatItem>
                      <Typography className="stat-label">
                        Win Rate
                      </Typography>
                      <Typography 
                        className="stat-value"
                        sx={{ color: (theme) => results.statistics.win_rate > 50 
                          ? theme.palette.success.main 
                          : theme.palette.error.main 
                        }}
                      >
                        {results.statistics.win_rate.toFixed(2)}%
                      </Typography>
                    </StatItem>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <StatItem>
                      <Typography className="stat-label">
                        Total Trades
                      </Typography>
                      <Typography className="stat-value" color="primary">
                        {results.statistics.total_trades}
                      </Typography>
                    </StatItem>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <StatItem>
                      <Typography className="stat-label">
                        Volatility
                      </Typography>
                      <Typography className="stat-value" color="primary">
                        {results.statistics.volatility.toFixed(2)}%
                      </Typography>
                    </StatItem>
                  </Grid>
                </Grid>
              </CardContent>
            </StatCard>
          </AnimatedSection>
        </Grid>

        {/* Strategy Suggestions */}
        <Grid item xs={12}>
          <AnimatedSection delay={0.8}>
            <StatCard>
              <CardContent>
                <StatHeader>
                  <Speed />
                  <Typography variant="h6">Strategy Suggestions</Typography>
                </StatHeader>
                
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1,
                  p: 2,
                  backgroundColor: 'background.default',
                  borderRadius: 1,
                }}>
                  {results.suggestions?.map((suggestion, index) => (
                    <GradientChip
                      key={index}
                      label={suggestion}
                      color={index % 2 ? 'primary' : 'secondary'}
                      sx={{ fontSize: '0.9rem', py: 1.5 }}
                    />
                  ))}
                </Box>
              </CardContent>
            </StatCard>
          </AnimatedSection>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BacktestResults; 