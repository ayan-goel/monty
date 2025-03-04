import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Grid, Card } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const AnalysisBox = styled(Card)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: theme.spacing(3),
  background: 'white',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  borderRadius: '12px',
  '& .analysis-header': {
    marginBottom: theme.spacing(2),
    borderBottom: `2px solid ${theme.palette.primary.main}`,
    paddingBottom: theme.spacing(1),
  },
}));

const MetricCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  borderRadius: '8px',
  '& .metric-label': {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
  },
  '& .metric-value': {
    fontWeight: 600,
    fontSize: '1.5rem',
  },
}));

// Create a keyframes animation for the typing indicator dots
const typingAnimation = keyframes`
  0% { opacity: 0.2; }
  20% { opacity: 1; }
  100% { opacity: 0.2; }
`;

// Dot component with a staggered animation delay
const Dot = styled('div')(({ theme }) => ({
  width: '8px',
  height: '8px',
  backgroundColor: theme.palette.text.secondary,
  borderRadius: '50%',
  margin: '0 2px',
  animation: `${typingAnimation} 1.4s infinite`,
}));

const TypingIndicatorContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

// TypingIndicator component with three animated dots
const TypingIndicator = () => (
  <TypingIndicatorContainer>
    <Dot style={{ animationDelay: '0s' }} />
    <Dot style={{ animationDelay: '0.2s' }} />
    <Dot style={{ animationDelay: '0.4s' }} />
  </TypingIndicatorContainer>
);

const MonteCarloResults = () => {
  const location = useLocation();
  const results = location.state?.results;
  const backtest_request = location.state?.backtest_request;
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await axios.post('https://monty.sathwik.tech/monte-carlo-analysis', {
          results,
          strategy: backtest_request,
        });
        setAnalysis(response.data.analysis);
      } catch (error) {
        console.error('Error fetching analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    if (results) {
      fetchAnalysis();
    }
  }, [results, backtest_request]);

  const metrics = [
    { label: 'Average Return', value: results?.avg_return },
    { label: 'Median Return', value: results?.median_return },
    { label: 'Highest Return', value: results?.highest_return },
    { label: 'Win Rate', value: results?.win_rate },
    { label: 'Average Drawdown', value: results?.avg_drawdown },
    { label: 'Median Drawdown', value: results?.median_drawdown },
    { label: 'Worst Drawdown', value: results?.worst_drawdown },
    { label: 'Successful Simulations', value: results?.successful_simulations },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h3"
        gutterBottom
        sx={{
          fontWeight: 700,
          fontSize: '2.5rem',
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 4,
        }}
      >
        Monte Carlo Simulation Results
      </Typography>

      <Grid container spacing={3}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} md={3} key={index}>
            <MetricCard>
              <Typography variant="h6" className="metric-label">
                {metric.label}
              </Typography>
              <Typography className="metric-value">
                {typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value}
              </Typography>
            </MetricCard>
          </Grid>
        ))}
      </Grid>

      <AnalysisBox>
        <Typography variant="h5" className="analysis-header" color="primary">
          Strategy Analysis & Recommendations
        </Typography>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '150px',
            }}
          >
            <TypingIndicator />
          </Box>
        ) : (
          <Box sx={{ whiteSpace: 'normal', lineHeight: 1.4 }}>
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </Box>
        )}
      </AnalysisBox>
    </Box>
  );
};

export default MonteCarloResults;