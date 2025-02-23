import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  ShowChart,
  TrendingUp,
  TrendingDown,
  Analytics,
} from '@mui/icons-material';

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
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Return
              </Typography>
              <Typography variant="h4">
                {results?.avg_return?.toFixed(2)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Win Rate
              </Typography>
              <Typography variant="h4">
                {results?.win_rate?.toFixed(2)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Add more metrics cards here */}
      </Grid>
    </Box>
  );
};

export default MonteCarloResults;