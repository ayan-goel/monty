import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, Box, AppBar, Toolbar, Typography } from '@mui/material';
import StrategyBuilder from './components/StrategyBuilder';
import BacktestResults from './components/BacktestResults';

function App() {
  return (
    <Router>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Algorithmic Strategy Builder
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Routes>
            <Route path="/" element={<StrategyBuilder />} />
            <Route path="/results" element={<BacktestResults />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  );
}

export default App;
