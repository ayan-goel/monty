import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Button,
  Box
} from '@mui/material';
import Chart from './Chart';

const BacktestResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const results = location.state?.results || {};

  if (!results.statistics) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          No results available
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Create New Strategy
        </Button>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          Backtest Results
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Chart data={results} />
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Performance Statistics
          </Typography>
          <TableContainer>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>Total Return</TableCell>
                  <TableCell align="right">
                    {results.statistics?.total_return.toFixed(2)}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sharpe Ratio</TableCell>
                  <TableCell align="right">
                    {results.statistics?.sharpe_ratio.toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Max Drawdown</TableCell>
                  <TableCell align="right">
                    {results.statistics?.max_drawdown.toFixed(2)}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Win Rate</TableCell>
                  <TableCell align="right">
                    {results.statistics?.win_rate.toFixed(2)}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total Trades</TableCell>
                  <TableCell align="right">
                    {results.statistics?.total_trades}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Strategy Suggestions
          </Typography>
          {results.suggestions?.map((suggestion, index) => (
            <Typography
              key={index}
              variant="body1"
              sx={{ mb: 1 }}
            >
              • {suggestion}
            </Typography>
          ))}
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Create New Strategy
        </Button>
      </Grid>
    </Grid>
  );
};

export default BacktestResults; 