import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { styled } from '@mui/material/styles';
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
  Select,
  MenuItem,
  InputLabel,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Fade,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import BarChartIcon from '@mui/icons-material/BarChart';

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

const IndicatorCard = styled(Card)(({ theme, enabled }) => ({
  marginBottom: theme.spacing(2),
  borderLeft: `4px solid ${enabled ? theme.palette.primary.main : 'transparent'}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: enabled ? theme.shadows[4] : theme.shadows[1],
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

const StyledSlider = styled(Slider)(({ theme }) => ({
  '& .MuiSlider-thumb': {
    '&:hover, &.Mui-focusVisible': {
      boxShadow: `0 0 0 8px ${theme.palette.primary.main}20`,
    },
  },
  '& .MuiSlider-track': {
    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
  },
}));

const AnimatedSection = styled(Box)(({ theme }) => ({
  opacity: 0,
  transform: 'translateY(20px)',
  animation: 'fadeIn 0.5s ease forwards',
  '@keyframes fadeIn': {
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
}));

const IndicatorSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  '& .MuiFormControl-root': {
    marginBottom: theme.spacing(2),
  },
  '& .MuiTypography-root': {
    fontSize: '1.1rem',
    fontWeight: 500,
  },
  '& .MuiFormControlLabel-root': {
    marginLeft: 0,
    marginRight: 0,
    width: '100%',
    justifyContent: 'space-between',
    '& .MuiTypography-root': {
      fontSize: '1.2rem',
      fontWeight: 600,
    },
  },
}));

const ParameterSelect = styled(FormControl)(({ theme }) => ({
  width: '100%',
  '& .MuiInputLabel-root': {
    fontSize: '1rem',
  },
  '& .MuiSelect-select': {
    fontSize: '1rem',
  },
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius,
  },
}));

const SectionHeader = styled(Typography)(({ theme }) => ({
  fontSize: '1.5rem',
  fontWeight: 700,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(3),
  marginTop: theme.spacing(4),
  paddingBottom: theme.spacing(2),
  borderBottom: `2px solid ${theme.palette.primary.main}`,
}));

const IndicatorCardContent = styled(CardContent)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2, 3), // Increased padding
  '& .MuiFormControlLabel-root': {
    margin: 0,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: '48px', // Ensure consistent height
  },
  '& .MuiFormControlLabel-label': {
    fontSize: '1.2rem',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
}));

const PositionSettingCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: 'white',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
  },
}));

// Helper Components
const InfoTooltip = ({ title }) => (
  <Tooltip title={title} arrow placement="top">
    <IconButton size="small" sx={{ ml: 1 }}>
      <InfoOutlinedIcon fontSize="small" />
    </IconButton>
  </Tooltip>
);

const IndicatorIcon = ({ type }) => {
  const icons = {
    sma: <ShowChartIcon />,
    ema: <TimelineIcon />,
    rsi: <TrendingUpIcon />,
    bollinger: <BarChartIcon />,
  };
  return icons[type] || null;
};

const PageHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(6),
  marginTop: theme.spacing(4),
  '& .title-section': {
    flex: 1,
  },
}));

const BasicSettingsCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: 'white',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
  },
}));

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

  const [indicatorSettings, setIndicatorSettings] = useState({
    sma: { enabled: false, period: 20, deviation: 1, crossDirection: 'above' },
    ema: { enabled: false, period: 20, deviation: 1, crossDirection: 'above' },
    rsi: { enabled: false, period: 14, threshold: 70, condition: 'crosses_above' },
    bollinger: { enabled: false, period: 20, stdDev: 2, condition: 'crosses_below' }
  });

  const crossDirections = ['above', 'below'];
  const rsiConditions = ['crosses_above', 'crosses_below', 'above', 'below'];
  const bollingerConditions = ['crosses_above', 'crosses_below', 'inside_bands', 'outside_bands'];

  const handleIndicatorChange = (indicatorType) => {
    setIndicatorSettings(prev => ({
      ...prev,
      [indicatorType]: {
        ...prev[indicatorType],
        enabled: !prev[indicatorType].enabled
      }
    }));

    // Update strategy.indicators based on new settings
    setStrategy(prev => {
      const newIndicators = { ...prev.indicators };
      if (!indicatorSettings[indicatorType].enabled) {
        newIndicators[indicatorType] = {
          ...indicatorSettings[indicatorType],
          type: indicatorType
        };
      } else {
        delete newIndicators[indicatorType];
      }
      return { ...prev, indicators: newIndicators };
    });
  };

  const handleSettingChange = (indicatorType, setting, value) => {
    setIndicatorSettings(prev => ({
      ...prev,
      [indicatorType]: {
        ...prev[indicatorType],
        [setting]: value
      }
    }));

    // Update strategy.indicators if the indicator is enabled
    if (indicatorSettings[indicatorType].enabled) {
      setStrategy(prev => ({
        ...prev,
        indicators: {
          ...prev.indicators,
          [indicatorType]: {
            ...prev.indicators[indicatorType],
            [setting]: value
          }
        }
      }));
    }
  };

  const renderIndicatorSettings = (type) => {
    if (!indicatorSettings[type].enabled) return null;

    return (
      <Fade in={true}>
        <Box sx={{ 
          mt: 2, 
          px: 3, 
          pb: 3, // Added bottom padding
          backgroundColor: 'white',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)'
        }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Period"
                type="number"
                value={indicatorSettings[type].period}
                onChange={(e) => handleSettingChange(type, 'period', parseInt(e.target.value))}
                InputProps={{
                  sx: { fontSize: '1rem' }
                }}
                InputLabelProps={{
                  sx: { fontSize: '1rem' }
                }}
              />
            </Grid>
            {(type === 'sma' || type === 'ema') && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Deviation (%)"
                  type="number"
                  value={indicatorSettings[type].deviation}
                  onChange={(e) => handleSettingChange(type, 'deviation', parseFloat(e.target.value))}
                  InputProps={{
                    sx: { fontSize: '1rem' }
                  }}
                  InputLabelProps={{
                    sx: { fontSize: '1rem' }
                  }}
                />
              </Grid>
            )}
            {(type === 'sma' || type === 'ema') && (
              <Grid item xs={12}>
                <ParameterSelect fullWidth>
                  <InputLabel>Cross Direction</InputLabel>
                  <Select
                    value={indicatorSettings[type].crossDirection}
                    onChange={(e) => handleSettingChange(type, 'crossDirection', e.target.value)}
                    label="Cross Direction"
                  >
                    <MenuItem value="above">Above</MenuItem>
                    <MenuItem value="below">Below</MenuItem>
                  </Select>
                </ParameterSelect>
              </Grid>
            )}
            {type === 'rsi' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Threshold"
                    type="number"
                    value={indicatorSettings[type].threshold}
                    onChange={(e) => handleSettingChange(type, 'threshold', parseInt(e.target.value))}
                    InputProps={{
                      sx: { fontSize: '1rem' }
                    }}
                    InputLabelProps={{
                      sx: { fontSize: '1rem' }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <ParameterSelect fullWidth>
                    <InputLabel>Condition</InputLabel>
                    <Select
                      value={indicatorSettings[type].condition}
                      onChange={(e) => handleSettingChange(type, 'condition', e.target.value)}
                      label="Condition"
                    >
                      <MenuItem value="crosses_above">Crosses Above</MenuItem>
                      <MenuItem value="crosses_below">Crosses Below</MenuItem>
                      <MenuItem value="above">Above</MenuItem>
                      <MenuItem value="below">Below</MenuItem>
                    </Select>
                  </ParameterSelect>
                </Grid>
              </>
            )}
            {type === 'bollinger' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Standard Deviation"
                    type="number"
                    value={indicatorSettings[type].stdDev}
                    onChange={(e) => handleSettingChange(type, 'stdDev', parseFloat(e.target.value))}
                    InputProps={{
                      sx: { fontSize: '1rem' }
                    }}
                    InputLabelProps={{
                      sx: { fontSize: '1rem' }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <ParameterSelect fullWidth>
                    <InputLabel>Condition</InputLabel>
                    <Select
                      value={indicatorSettings[type].condition}
                      onChange={(e) => handleSettingChange(type, 'condition', e.target.value)}
                      label="Condition"
                    >
                      <MenuItem value="crosses_above">Crosses Upper Band</MenuItem>
                      <MenuItem value="crosses_below">Crosses Lower Band</MenuItem>
                      <MenuItem value="inside_bands">Inside Bands</MenuItem>
                      <MenuItem value="outside_bands">Outside Bands</MenuItem>
                    </Select>
                  </ParameterSelect>
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      </Fade>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Format indicators properly
      const formattedIndicators = {};
      Object.entries(indicatorSettings)
        .filter(([_, settings]) => settings.enabled)
        .forEach(([type, settings]) => {
          formattedIndicators[type] = {
            enabled: settings.enabled,
            period: settings.period,
            type: type,
            ...(settings.deviation && { deviation: settings.deviation }),
            ...(settings.crossDirection && { crossDirection: settings.crossDirection }),
            ...(settings.threshold && { threshold: settings.threshold }),
            ...(settings.condition && { condition: settings.condition }),
            ...(settings.stdDev && { stdDev: settings.stdDev })
          };
        });

      const response = await axios.post('http://localhost:8000/backtest', {
        symbol: strategy.symbol,
        start_date: strategy.start_date,
        end_date: strategy.end_date,
        indicators: formattedIndicators,
        position_size: strategy.position_size,
        take_profit: strategy.take_profit,
        stop_loss: strategy.stop_loss
      });

      navigate('/results', { state: { results: response.data } });
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'An error occurred';
      setError(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
    }
  };

  const renderIndicatorCard = (type, title, description) => (
    <IndicatorCard enabled={indicatorSettings[type].enabled}>
      <IndicatorCardContent>
        <FormControlLabel
          control={
            <Checkbox
              checked={indicatorSettings[type].enabled}
              onChange={() => handleIndicatorChange(type)}
              color="primary"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IndicatorIcon type={type} />
              <Typography sx={{ ml: 1 }}>{title}</Typography>
              <InfoTooltip title={description} />
            </Box>
          }
        />
      </IndicatorCardContent>
      <Fade in={indicatorSettings[type].enabled}>
        <Box>{renderIndicatorSettings(type)}</Box>
      </Fade>
    </IndicatorCard>
  );

  return (
    <AnimatedSection>
      <PageHeader>
        <Box className="title-section">
          <Typography variant="h3" gutterBottom sx={{ 
            fontWeight: 700,
            fontSize: '2.5rem',
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
          }}>
            Create Your Trading Strategy!
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '800px', lineHeight: 1.6 }}>
            Welcome to the future of algorithmic trading. Design, test, and optimize your trading 
            strategies using advanced technical indicators and real market data. Our platform 
            empowers you to make data-driven decisions with confidence.
          </Typography>
        </Box>
      </PageHeader>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SectionHeader>
              Basic Settings
            </SectionHeader>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <BasicSettingsCard>
                  <TextField
                    fullWidth
                    label="Symbol"
                    value={strategy.symbol}
                    onChange={(e) => setStrategy({...strategy, symbol: e.target.value})}
                    InputProps={{
                      sx: { 
                        fontSize: '1.1rem',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'transparent'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'transparent'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        }
                      }
                    }}
                    InputLabelProps={{
                      sx: { fontSize: '1.1rem' }
                    }}
                  />
                </BasicSettingsCard>
              </Grid>
              <Grid item xs={12} sm={4}>
                <BasicSettingsCard>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date"
                    InputLabelProps={{ 
                      shrink: true,
                      sx: { fontSize: '1.1rem' }
                    }}
                    value={strategy.start_date}
                    onChange={(e) => setStrategy({...strategy, start_date: e.target.value})}
                    InputProps={{
                      sx: { 
                        fontSize: '1.1rem',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'transparent'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'transparent'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        }
                      }
                    }}
                  />
                </BasicSettingsCard>
              </Grid>
              <Grid item xs={12} sm={4}>
                <BasicSettingsCard>
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    InputLabelProps={{ 
                      shrink: true,
                      sx: { fontSize: '1.1rem' }
                    }}
                    value={strategy.end_date}
                    onChange={(e) => setStrategy({...strategy, end_date: e.target.value})}
                    InputProps={{
                      sx: { 
                        fontSize: '1.1rem',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'transparent'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'transparent'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        }
                      }
                    }}
                  />
                </BasicSettingsCard>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <SectionHeader>
              Technical Indicators
            </SectionHeader>
            <Box sx={{ mb: 4 }}>
              {renderIndicatorCard('sma', 'Simple Moving Average', 
                'SMA calculates the average price over a specified period')}
              {renderIndicatorCard('ema', 'Exponential Moving Average', 
                'EMA gives more weight to recent prices')}
              {renderIndicatorCard('rsi', 'Relative Strength Index', 
                'RSI measures the speed and magnitude of recent price changes')}
              {renderIndicatorCard('bollinger', 'Bollinger Bands', 
                'Bollinger Bands measure market volatility')}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <SectionHeader>
              Position Settings
            </SectionHeader>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <PositionSettingCard>
                  <Box sx={{ px: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Position Size (%)
                      <InfoTooltip title="Percentage of capital to use per trade" />
                    </Typography>
                    <StyledSlider
                      value={strategy.position_size}
                      onChange={(e, newValue) => setStrategy({...strategy, position_size: newValue})}
                      min={1}
                      max={100}
                      valueLabelDisplay="auto"
                      sx={{ mt: 2 }}
                    />
                  </Box>
                </PositionSettingCard>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <PositionSettingCard>
                  <Box sx={{ px: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Take Profit (%)
                      <InfoTooltip title="Target profit percentage" />
                    </Typography>
                    <StyledSlider
                      value={strategy.take_profit}
                      onChange={(e, newValue) => setStrategy({...strategy, take_profit: newValue})}
                      min={0.5}
                      max={20}
                      step={0.5}
                      valueLabelDisplay="auto"
                      sx={{ mt: 2 }}
                    />
                  </Box>
                </PositionSettingCard>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <PositionSettingCard>
                  <Box sx={{ px: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Stop Loss (%)
                      <InfoTooltip title="Maximum loss percentage" />
                    </Typography>
                    <StyledSlider
                      value={strategy.stop_loss}
                      onChange={(e, newValue) => setStrategy({...strategy, stop_loss: newValue})}
                      min={0.5}
                      max={20}
                      step={0.5}
                      valueLabelDisplay="auto"
                      sx={{ mt: 2 }}
                    />
                  </Box>
                </PositionSettingCard>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <GradientButton
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              sx={{ mt: 2 }}
            >
              Run Backtest
            </GradientButton>
          </Grid>
        </Grid>
      </Box>
    </AnimatedSection>
  );
};

export default StrategyBuilder; 