import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Typography,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  Alert
} from '@mui/material';

const StrategyBuilder = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [strategy, setStrategy] = useState({
    symbol: '',
    start_date: '',
    end_date: '',
    indicators: {},
    position_size: 5,
    take_profit: 3,
    stop_loss: 2
  });

  const [availableIndicators] = useState([
    { id: 'ma_20', name: 'Moving Average 20', type: 'ma', period: 20 },
    { id: 'ma_50', name: 'Moving Average 50', type: 'ma', period: 50 },
    { id: 'rsi', name: 'RSI', type: 'oscillator', period: 14 },
    { id: 'fibonacci', name: 'Fibonacci Bands', type: 'bands' }
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://localhost:8000/backtest', strategy);
      navigate('/results', { state: { results: response.data } });
    } catch (error) {
      setError(error.response?.data?.detail || 'Error running backtest');
    }
  };

  const handleIndicatorChange = (indicator) => {
    setStrategy(prev => ({
      ...prev,
      indicators: {
        ...prev.indicators,
        [indicator.id]: {
          type: indicator.type,
          period: indicator.period
        }
      }
    }));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Create Strategy
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Symbol"
              value={strategy.symbol}
              onChange={(e) => setStrategy({...strategy, symbol: e.target.value})}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={strategy.start_date}
              onChange={(e) => setStrategy({...strategy, start_date: e.target.value})}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              InputLabelProps={{ shrink: true }}
              value={strategy.end_date}
              onChange={(e) => setStrategy({...strategy, end_date: e.target.value})}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Indicators
            </Typography>
            <FormControl component="fieldset">
              <FormGroup>
                {availableIndicators.map(indicator => (
                  <FormControlLabel
                    key={indicator.id}
                    control={
                      <Checkbox
                        checked={!!strategy.indicators[indicator.id]}
                        onChange={() => handleIndicatorChange(indicator)}
                      />
                    }
                    label={indicator.name}
                  />
                ))}
              </FormGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Typography gutterBottom>
              Position Size (%)
            </Typography>
            <Slider
              value={strategy.position_size}
              onChange={(e, newValue) => setStrategy({...strategy, position_size: newValue})}
              min={1}
              max={100}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography gutterBottom>
              Take Profit (%)
            </Typography>
            <Slider
              value={strategy.take_profit}
              onChange={(e, newValue) => setStrategy({...strategy, take_profit: newValue})}
              min={0.5}
              max={20}
              step={0.5}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography gutterBottom>
              Stop Loss (%)
            </Typography>
            <Slider
              value={strategy.stop_loss}
              onChange={(e, newValue) => setStrategy({...strategy, stop_loss: newValue})}
              min={0.5}
              max={20}
              step={0.5}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
            >
              Run Backtest
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default StrategyBuilder; 