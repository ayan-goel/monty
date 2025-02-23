import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';

const MonteCarloResults = () => {
  const location = useLocation();
  const results = location.state?.results;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom sx={{
        fontWeight: 700,
        fontSize: '2.5rem',
        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        mb: 4,
      }}>
        Monte Carlo Simulation Results
      </Typography>

      <Grid container spacing={3}>
        {[
          { label: 'Average Return', value: results?.avg_return },
          { label: 'Median Return', value: results?.median_return },
          { label: 'Highest Return', value: results?.highest_return },
          { label: 'Win Rate', value: results?.win_rate },
          { label: 'Average Drawdown', value: results?.avg_drawdown },
          { label: 'Median Drawdown', value: results?.median_drawdown },
          { label: 'Worst Drawdown', value: results?.worst_drawdown },
          { label: 'Successful Simulations', value: results?.successful_simulations },
        ].map((metric, index) => (
          <Grid item xs={12} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {metric.label}
                </Typography>
                <Typography variant="h4">
                  {metric.value?.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MonteCarloResults;