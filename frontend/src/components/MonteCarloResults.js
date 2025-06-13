import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { ArrowBack, TrendingUp, TrendingDown, Assessment, Speed, ShowChart, Casino, BarChart, Lightbulb, Security, Psychology, TipsAndUpdates, AccountBalance } from '@mui/icons-material';
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

const AnalysisCard = styled(Card)(({ theme, variant }) => {
  const getColors = () => {
    switch (variant) {
      case 'excellent':
        return { 
          background: 'linear-gradient(145deg, #f8fff8 0%, #e8f5e8 100%)', 
          borderColor: '#4caf50', 
          iconBg: '#4caf50',
          iconColor: '#ffffff',
          titleColor: '#1b5e20',
          shadowColor: 'rgba(76, 175, 80, 0.15)'
        };
      case 'good':
        return { 
          background: 'linear-gradient(145deg, #f3f8ff 0%, #e8f4fd 100%)', 
          borderColor: '#2196f3', 
          iconBg: '#2196f3',
          iconColor: '#ffffff',
          titleColor: '#0d47a1',
          shadowColor: 'rgba(33, 150, 243, 0.15)'
        };
      case 'fair':
        return { 
          background: 'linear-gradient(145deg, #fffbf5 0%, #fff3e0 100%)', 
          borderColor: '#ff9800', 
          iconBg: '#ff9800',
          iconColor: '#ffffff',
          titleColor: '#e65100',
          shadowColor: 'rgba(255, 152, 0, 0.15)'
        };
      case 'poor':
        return { 
          background: 'linear-gradient(145deg, #fffafa 0%, #ffebee 100%)', 
          borderColor: '#f44336', 
          iconBg: '#f44336',
          iconColor: '#ffffff',
          titleColor: '#b71c1c',
          shadowColor: 'rgba(244, 67, 54, 0.15)'
        };
      default:
        return { 
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', 
          borderColor: '#e2e8f0', 
          iconBg: '#64748b',
          iconColor: '#ffffff',
          titleColor: '#334155',
          shadowColor: 'rgba(100, 116, 139, 0.1)'
        };
    }
  };

  const colors = getColors();
  
  return {
    marginBottom: theme.spacing(2),
    background: colors.background,
    border: `2px solid ${colors.borderColor}`,
    borderRadius: '16px',
    boxShadow: `0 6px 20px ${colors.shadowColor}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    position: 'relative',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 12px 40px ${colors.shadowColor}`,
      borderColor: colors.iconBg,
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: `linear-gradient(90deg, ${colors.iconBg}, ${colors.borderColor})`,
    },
    '& .section-header': {
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(2.5, 3, 1.5, 3),
      '& .section-icon-container': {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: colors.iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing(2),
        boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)`,
        '& .section-icon': {
          color: colors.iconColor,
          fontSize: '1.5rem',
        }
      },
      '& .section-title': {
        fontWeight: 700,
        color: colors.titleColor,
        fontSize: '1.3rem',
        margin: 0,
      }
    },
    '& .section-content': {
      padding: theme.spacing(0, 3, 2.5, 3),
      '& .MuiTypography-root': {
        lineHeight: 1.5,
        marginBottom: theme.spacing(1),
        color: theme.palette.text.primary,
      },
      '& .section-subtitle': {
        fontWeight: 600,
        color: colors.titleColor,
        marginBottom: theme.spacing(0.5),
        marginTop: theme.spacing(1.5),
        fontSize: '1rem',
      },
      '& ul': {
        paddingLeft: theme.spacing(2.5),
        margin: theme.spacing(0.5, 0),
        '& li': {
          marginBottom: theme.spacing(1),
          lineHeight: 1.5,
          color: theme.palette.text.primary,
          '&::marker': {
            color: colors.iconBg,
          }
        }
      }
    }
  };
});

const StatCard = styled(Card)(({ theme }) => ({
  height: '100%',
  minHeight: '200px',
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
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
    fontSize: '1.75rem',
  },
  '& .MuiTypography-root': {
    fontSize: '1.1rem',
    fontWeight: 600,
  },
}));

const StatValue = styled(Typography)(({ positive, theme }) => ({
  fontSize: '1.8rem',
  fontWeight: 700,
  color: positive === true ? theme.palette.success.main : 
         positive === false ? theme.palette.error.main : 
         theme.palette.primary.main,
  marginBottom: theme.spacing(1),
}));

const StatSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.text.secondary,
  fontWeight: 500,
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
  const navigate = useNavigate();
  const location = useLocation();
  const results = location.state?.results;
  const backtest_request = location.state?.backtest_request;
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await axios.post('https://0e56rmnbl1.execute-api.us-east-1.amazonaws.com/dev/monte-carlo-analysis', {
          results,
          strategy: backtest_request,
        });
        
        console.log('Analysis response:', response.data);
        
        // Handle different response formats
        let analysisData = response.data.analysis;
        
        // If the analysis is a string that looks like JSON, try to parse it
        if (typeof analysisData === 'string' && analysisData.trim().startsWith('{')) {
          try {
            analysisData = JSON.parse(analysisData);
          } catch (parseError) {
            console.error('Failed to parse JSON string:', parseError);
          }
        }
        
        setAnalysis(analysisData);
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

  const getMetricPositive = (label, value) => {
    switch (label) {
      case 'Average Return':
      case 'Median Return':
      case 'Highest Return':
        return value > 0 ? true : false;
      case 'Win Rate':
        return value > 50 ? true : value < 40 ? false : null;
      case 'Average Drawdown':
      case 'Median Drawdown':
      case 'Worst Drawdown':
        return value < 10 ? true : value > 20 ? false : null;
      case 'Sharpe Ratio':
        return value > 1 ? true : value < 0.5 ? false : null;
      default:
        return null;
    }
  };

  const getMetricIcon = (label) => {
    switch (label) {
      case 'Average Return':
      case 'Median Return':
      case 'Highest Return':
        return <TrendingUp />;
      case 'Win Rate':
        return <Assessment />;
      case 'Average Drawdown':
      case 'Median Drawdown':
      case 'Worst Drawdown':
        return <TrendingDown />;
      case 'Sharpe Ratio':
        return <Speed />;
      default:
        return <ShowChart />;
    }
  };

  const getMetricSubtitle = (label, value) => {
    switch (label) {
      case 'Average Return':
        return value > 10 ? 'Excellent performance' : value > 0 ? 'Positive returns' : 'Negative returns';
      case 'Median Return':
        return value > 10 ? 'Strong median performance' : value > 0 ? 'Positive median returns' : 'Negative median returns';
      case 'Win Rate':
        return value > 60 ? 'High success rate' : value > 40 ? 'Moderate success' : 'Low success rate';
      case 'Worst Drawdown':
        return value < 10 ? 'Low risk' : value < 20 ? 'Moderate risk' : 'High risk';
      case 'Sharpe Ratio':
        return value > 1 ? 'Excellent risk-adjusted returns' : value > 0.5 ? 'Good risk-adjusted returns' : 'Poor risk-adjusted returns';
      default:
        return '';
    }
  };

  const metrics = [
    { 
      label: 'Average Return', 
      value: results?.avg_return,
      suffix: '%',
      positive: getMetricPositive('Average Return', results?.avg_return),
      icon: getMetricIcon('Average Return'),
      subtitle: getMetricSubtitle('Average Return', results?.avg_return)
    },
    { 
      label: 'Median Return', 
      value: results?.median_return,
      suffix: '%',
      positive: getMetricPositive('Median Return', results?.median_return),
      icon: getMetricIcon('Median Return'),
      subtitle: getMetricSubtitle('Median Return', results?.median_return)
    },
    { 
      label: 'Highest Return', 
      value: results?.highest_return,
      suffix: '%',
      positive: getMetricPositive('Highest Return', results?.highest_return),
      icon: getMetricIcon('Highest Return'),
      subtitle: 'Best case scenario'
    },
    { 
      label: 'Win Rate', 
      value: results?.win_rate,
      suffix: '%',
      positive: getMetricPositive('Win Rate', results?.win_rate),
      icon: getMetricIcon('Win Rate'),
      subtitle: getMetricSubtitle('Win Rate', results?.win_rate)
    },
    { 
      label: 'Average Drawdown', 
      value: results?.avg_drawdown,
      suffix: '%',
      positive: getMetricPositive('Average Drawdown', results?.avg_drawdown),
      icon: getMetricIcon('Average Drawdown'),
      subtitle: 'Typical risk exposure'
    },
    { 
      label: 'Median Drawdown', 
      value: results?.median_drawdown,
      suffix: '%',
      positive: getMetricPositive('Median Drawdown', results?.median_drawdown),
      icon: getMetricIcon('Median Drawdown'),
      subtitle: 'Middle risk scenario'
    },
    { 
      label: 'Worst Drawdown', 
      value: results?.worst_drawdown,
      suffix: '%',
      positive: getMetricPositive('Worst Drawdown', results?.worst_drawdown),
      icon: getMetricIcon('Worst Drawdown'),
      subtitle: getMetricSubtitle('Worst Drawdown', results?.worst_drawdown)
    },
    { 
      label: 'Sharpe Ratio', 
      value: results?.sharpe_ratio,
      suffix: '',
      positive: getMetricPositive('Sharpe Ratio', results?.sharpe_ratio),
      icon: getMetricIcon('Sharpe Ratio'),
      subtitle: getMetricSubtitle('Sharpe Ratio', results?.sharpe_ratio)
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4 
      }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/results', { 
            state: { 
              results: location.state?.backtestResults, 
              backtest_request: backtest_request 
            } 
          })}
          variant="outlined"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem',
            py: 1,
            px: 2,
            '&:hover': {
              backgroundColor: 'rgba(33, 150, 243, 0.08)',
            },
          }}
        >
          Back to Backtest Results
        </Button>
      </Box>

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
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <StatCard>
              <CardContent>
                <StatHeader>
                  {metric.icon}
                  <Typography variant="h6">
                    {metric.label}
                  </Typography>
                </StatHeader>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <StatValue positive={metric.positive}>
                    {typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value}{metric.suffix}
                  </StatValue>
                  {metric.subtitle && (
                    <StatSubtitle>
                      {metric.subtitle}
                    </StatSubtitle>
                  )}
                </Box>
              </CardContent>
            </StatCard>
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
        ) : analysis && typeof analysis === 'object' && !Array.isArray(analysis) && analysis.overall_assessment ? (
          <Box>
            {/* Overall Assessment */}
            <AnalysisCard variant={analysis.overall_assessment?.rating?.toLowerCase()}>
              <Box className="section-header">
                <Box className="section-icon-container">
                  <Assessment className="section-icon" />
                </Box>
                <Typography className="section-title">
                  Overall Assessment: {analysis.overall_assessment?.rating}
                </Typography>
              </Box>
              <Box className="section-content">
                <Typography variant="body1">
                  {analysis.overall_assessment?.summary}
                </Typography>
              </Box>
            </AnalysisCard>

            {/* Key Insights */}
            {analysis.key_insights && (
              <AnalysisCard variant="good">
                <Box className="section-header">
                  <Box className="section-icon-container">
                    <Lightbulb className="section-icon" />
                  </Box>
                  <Typography className="section-title">Key Insights</Typography>
                </Box>
                <Box className="section-content">
                  <Box component="ul">
                    {analysis.key_insights.map((insight, index) => (
                      <Typography component="li" key={index} variant="body1">
                        {insight}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </AnalysisCard>
            )}

            {/* Risk Management */}
            {analysis.risk_management && (
              <AnalysisCard variant="good">
                <Box className="section-header">
                  <Box className="section-icon-container">
                    <Security className="section-icon" />
                  </Box>
                  <Typography className="section-title">Risk Management</Typography>
                </Box>
                <Box className="section-content">
                  <Typography className="section-subtitle">
                    Assessment:
                  </Typography>
                  <Typography variant="body1">
                    {analysis.risk_management.current_assessment}
                  </Typography>
                  
                  <Typography className="section-subtitle">
                    Recommendations:
                  </Typography>
                  <Box component="ul">
                    {analysis.risk_management.recommendations?.map((rec, index) => (
                      <Typography component="li" key={index} variant="body1">
                        {rec}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </AnalysisCard>
            )}

            {/* Strategy Strengths */}
            {analysis.strategy_optimization?.strengths && (
              <AnalysisCard variant="excellent">
                <Box className="section-header">
                  <Box className="section-icon-container">
                    <TrendingUp className="section-icon" />
                  </Box>
                  <Typography className="section-title">Strategy Strengths</Typography>
                </Box>
                <Box className="section-content">
                  <Box component="ul">
                    {analysis.strategy_optimization.strengths.map((strength, index) => (
                      <Typography component="li" key={index} variant="body1">
                        {strength}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </AnalysisCard>
            )}

            {/* Areas for Improvement */}
            {analysis.strategy_optimization?.weaknesses && (
              <AnalysisCard variant="fair">
                <Box className="section-header">
                  <Box className="section-icon-container">
                    <Psychology className="section-icon" />
                  </Box>
                  <Typography className="section-title">Areas for Improvement</Typography>
                </Box>
                <Box className="section-content">
                  <Box component="ul">
                    {analysis.strategy_optimization.weaknesses.map((weakness, index) => (
                      <Typography component="li" key={index} variant="body1">
                        {weakness}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </AnalysisCard>
            )}

            {/* Suggested Improvements */}
            {analysis.strategy_optimization?.improvements && (
              <AnalysisCard variant="good">
                <Box className="section-header">
                  <Box className="section-icon-container">
                    <TipsAndUpdates className="section-icon" />
                  </Box>
                  <Typography className="section-title">Suggested Improvements</Typography>
                </Box>
                <Box className="section-content">
                  <Box component="ul">
                    {analysis.strategy_optimization.improvements.map((improvement, index) => (
                      <Typography component="li" key={index} variant="body1">
                        {improvement}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </AnalysisCard>
            )}

            {/* Position Sizing Analysis */}
            {analysis.position_sizing && (
              <AnalysisCard variant="good">
                <Box className="section-header">
                  <Box className="section-icon-container">
                    <AccountBalance className="section-icon" />
                  </Box>
                  <Typography className="section-title">Position Sizing Analysis</Typography>
                </Box>
                <Box className="section-content">
                  <Typography className="section-subtitle">
                    Current Analysis:
                  </Typography>
                  <Typography variant="body1">
                    {analysis.position_sizing.current_analysis}
                  </Typography>
                  
                  <Typography className="section-subtitle">
                    Recommendation:
                  </Typography>
                  <Typography variant="body1">
                    {analysis.position_sizing.recommendation}
                  </Typography>
                </Box>
              </AnalysisCard>
            )}
          </Box>
        ) : (
          <Box sx={{ whiteSpace: 'normal', lineHeight: 1.4 }}>
            <ReactMarkdown>{typeof analysis === 'string' ? analysis : 'No analysis available'}</ReactMarkdown>
          </Box>
        )}
      </AnalysisBox>
    </Box>
  );
};

export default MonteCarloResults;