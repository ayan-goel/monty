import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Slider,
  Tooltip,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Info,
  Casino,
  Timeline,
  Assessment
} from '@mui/icons-material';



const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
  color: 'white',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 20px rgba(33, 150, 243, 0.3)',
  },
}));

const MonteCarloSimulator = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [simulationParams, setSimulationParams] = useState({
    lookback_years: 10,
    simulation_length_days: 252,
    num_simulations: 500,
    backtest_request: {
      symbol: '',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      timeframe: '1d',
      initial_capital: 10000,
      entry_conditions: {
        trade_direction: 'BUY'
      },
      exit_conditions: {
        stop_loss_pct: 2,
        take_profit_pct: 4,
        position_size_pct: 10
      }
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('https://0e56rmnbl1.execute-api.us-east-1.amazonaws.com/dev/monte-carlo', simulationParams);
      navigate('/monte-carlo-results', { state: { results: response.data } });
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'An error occurred';
      setError(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const LoadingOverlay = () => (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 2, color: 'primary.main' }}>
        Running Monte Carlo Simulations...
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      {isLoading && <LoadingOverlay />}
      
      <Typography variant="h3" gutterBottom sx={{
        fontWeight: 700,
        fontSize: '2.5rem',
        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        mb: 4,
      }}>
        Monte Carlo Simulation
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lookback Period
                <Tooltip title="Number of years of historical data to use">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <Info fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              <Slider
                value={simulationParams.lookback_years}
                onChange={(e, value) => setSimulationParams({
                  ...simulationParams,
                  lookback_years: value
                })}
                min={1}
                max={20}
                marks
                valueLabelDisplay="auto"
              />
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Simulation Length (Days)
                <Tooltip title="Number of trading days to simulate">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <Info fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              <Slider
                value={simulationParams.simulation_length_days}
                onChange={(e, value) => setSimulationParams({
                  ...simulationParams,
                  simulation_length_days: value
                })}
                min={21}
                max={504}
                step={21}
                marks
                valueLabelDisplay="auto"
              />
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Number of Simulations
                <Tooltip title="Total number of Monte Carlo simulations to run">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <Info fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              <Slider
                value={simulationParams.num_simulations}
                onChange={(e, value) => setSimulationParams({
                  ...simulationParams,
                  num_simulations: value
                })}
                min={100}
                max={1000}
                step={100}
                marks
                valueLabelDisplay="auto"
              />
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid item xs={12}>
          <GradientButton
            onClick={handleSubmit}
            variant="contained"
            size="large"
            fullWidth
            startIcon={<Casino />}
          >
            Run Monte Carlo Simulation
          </GradientButton>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MonteCarloSimulator;