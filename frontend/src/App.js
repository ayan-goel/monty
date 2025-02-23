import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Container, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import StrategyBuilder from './components/StrategyBuilder';
import BacktestResults from './components/BacktestResults';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(20px)',
  boxShadow: 'none',
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
  height: '90px',
  justifyContent: 'center',
}));

const Logo = styled(Typography)(({ theme }) => ({
  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 800,
  letterSpacing: '-0.5px',
  fontSize: '3.2rem',
  textAlign: 'left',
  paddingLeft: '0px',
}));

const MainContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(8),
  marginBottom: theme.spacing(4),
}));

function App() {
  return (
    <Router>
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: 'background.default',
        backgroundImage: 'linear-gradient(45deg, rgba(33, 150, 243, 0.05), rgba(33, 203, 243, 0.05))',
      }}>
        <StyledAppBar position="sticky">
          <Container maxWidth="lg">
            <Toolbar disableGutters>
              <Logo variant="h3">
                Monty.
              </Logo>
            </Toolbar>
          </Container>
        </StyledAppBar>
        
        <MainContainer maxWidth="lg">
          <Routes>
            <Route path="/" element={<StrategyBuilder />} />
            <Route path="/results" element={<BacktestResults />} />
          </Routes>
        </MainContainer>
      </Box>
    </Router>
  );
}

export default App;
