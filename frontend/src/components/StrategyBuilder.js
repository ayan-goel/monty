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
  RadioGroup,
  FormControlLabel as MuiFormControlLabel,
  Radio,
} from '@mui/material';
import {
  Timeline,
  BarChart,
  ShowChart,
  Info,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';

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
  padding: theme.spacing(2, 3),
  '& .MuiFormControlLabel-root': {
    margin: 0,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: '48px',
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

const TradeDirectionCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  backgroundColor: 'white',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
}));

const InfoTooltip = ({ title }) => (
  <Tooltip title={title} arrow placement="top">
    <IconButton size="small" sx={{ ml: 1 }}>
      <Info fontSize="small" />
    </IconButton>
  </Tooltip>
);

const IndicatorIcon = ({ type }) => {
  const icons = {
    sma: <ShowChart />,
    ema: <Timeline />,
    rsi: <TrendingUp />,
    bollinger: <BarChart />,
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
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    timeframe: '1h',
    initial_capital: 10000,
    entry_conditions: {
      trade_direction: 'BUY',
      ma_condition: null,
      rsi_condition: null
    },
    exit_conditions: {
      stop_loss_pct: 2,
      take_profit_pct: 4,
      position_size_pct: 10
    }
  });

  const [indicatorSettings, setIndicatorSettings] = useState({
    ma: {
      enabled: false,
      period: 20,
      type: 'SMA',
      comparison: 'BELOW',
      deviation_pct: 0.5
    },
    rsi: {
      enabled: false,
      period: 14,
      comparison: 'BELOW',
      value: 30
    }
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

  const handleIndicatorToggle = (indicator) => {
    setIndicatorSettings({
      ...indicatorSettings,
      [indicator]: {
        ...indicatorSettings[indicator],
        enabled: !indicatorSettings[indicator].enabled
      }
    });
  };

  const handleIndicatorSettingChange = (indicator, setting, value) => {
    setIndicatorSettings({
      ...indicatorSettings,
      [indicator]: {
        ...indicatorSettings[indicator],
        [setting]: value
      }
    });
  };

  const renderIndicatorSettings = (type) => {
    if (!indicatorSettings[type].enabled) return null;

    return (
      <Fade in={true}>
        <Box sx={{ 
          mt: 2, 
          px: 3, 
          pb: 3,
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

  const renderMASettings = () => {
    if (!indicatorSettings.ma.enabled) return null;

    return (
      <Fade in={true}>
        <Box sx={{ mt: 2, px: 3, pb: 3, backgroundColor: 'white' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Period"
                type="number"
                value={indicatorSettings.ma.period}
                onChange={(e) => handleIndicatorSettingChange('ma', 'period', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Deviation (%)"
                type="number"
                value={indicatorSettings.ma.deviation_pct}
                onChange={(e) => handleIndicatorSettingChange('ma', 'deviation_pct', parseFloat(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>MA Type</InputLabel>
                <Select
                  value={indicatorSettings.ma.type}
                  onChange={(e) => handleIndicatorSettingChange('ma', 'type', e.target.value)}
                  label="MA Type"
                >
                  <MenuItem value="SMA">Simple MA</MenuItem>
                  <MenuItem value="EMA">Exponential MA</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Comparison</InputLabel>
                <Select
                  value={indicatorSettings.ma.comparison}
                  onChange={(e) => handleIndicatorSettingChange('ma', 'comparison', e.target.value)}
                  label="Comparison"
                >
                  <MenuItem value="CROSS_ABOVE">Crosses Above</MenuItem>
                  <MenuItem value="CROSS_BELOW">Crosses Below</MenuItem>
                  <MenuItem value="ABOVE">Above</MenuItem>
                  <MenuItem value="BELOW">Below</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Fade>
    );
  };

  const renderRSISettings = () => {
    if (!indicatorSettings.rsi.enabled) return null;

    return (
      <Fade in={true}>
        <Box sx={{ mt: 2, px: 3, pb: 3, backgroundColor: 'white' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Period"
                type="number"
                value={indicatorSettings.rsi.period}
                onChange={(e) => handleIndicatorSettingChange('rsi', 'period', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Value"
                type="number"
                value={indicatorSettings.rsi.value}
                onChange={(e) => handleIndicatorSettingChange('rsi', 'value', parseFloat(e.target.value))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Comparison</InputLabel>
                <Select
                  value={indicatorSettings.rsi.comparison}
                  onChange={(e) => handleIndicatorSettingChange('rsi', 'comparison', e.target.value)}
                  label="Comparison"
                >
                  <MenuItem value="ABOVE">Above</MenuItem>
                  <MenuItem value="BELOW">Below</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Fade>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const requestBody = {
        symbol: strategy.symbol,
        start_date: strategy.start_date,
        end_date: strategy.end_date,
        timeframe: strategy.timeframe,
        initial_capital: strategy.initial_capital,
        entry_conditions: {
          trade_direction: strategy.entry_conditions.trade_direction,
          ma_condition: indicatorSettings.ma.enabled ? {
            period: indicatorSettings.ma.period,
            ma_type: indicatorSettings.ma.type,
            comparison: indicatorSettings.ma.comparison,
            deviation_pct: indicatorSettings.ma.deviation_pct
          } : null,
          rsi_condition: indicatorSettings.rsi.enabled ? {
            period: indicatorSettings.rsi.period,
            comparison: indicatorSettings.rsi.comparison,
            value: indicatorSettings.rsi.value
          } : null
        },
        exit_conditions: {
          stop_loss_pct: strategy.exit_conditions.stop_loss_pct,
          take_profit_pct: strategy.exit_conditions.take_profit_pct,
          position_size_pct: strategy.exit_conditions.position_size_pct
        }
      };
      
      console.log(requestBody)
      const response = await axios.post('http://localhost:8000/backtest', requestBody);
      console.log(response)
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
              Trade Direction
            </SectionHeader>
            <TradeDirectionCard>
              <FormControl component="fieldset">
                <RadioGroup
                  row
                  value={strategy.entry_conditions.trade_direction}
                  onChange={(e) => setStrategy({
                    ...strategy,
                    entry_conditions: {
                      ...strategy.entry_conditions,
                      trade_direction: e.target.value
                    }
                  })}
                >
                  <FormControlLabel 
                    value="BUY" 
                    control={<Radio />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                        <Typography>Buy</Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel 
                    value="SELL" 
                    control={<Radio />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingDown sx={{ color: 'error.main', mr: 1 }} />
                        <Typography>Sell</Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </TradeDirectionCard>
          </Grid>

          <Grid item xs={12}>
            <SectionHeader>
              Technical Indicators
            </SectionHeader>
            <Box sx={{ mb: 4 }}>
              <IndicatorCard enabled={indicatorSettings.ma.enabled}>
                <CardContent>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={indicatorSettings.ma.enabled}
                        onChange={() => handleIndicatorChange('ma')}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ShowChart sx={{ mr: 1 }} />
                        <Typography>Moving Average</Typography>
                      </Box>
                    }
                  />
                </CardContent>
                {renderMASettings()}
              </IndicatorCard>
              
              <IndicatorCard enabled={indicatorSettings.rsi.enabled}>
                <CardContent>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={indicatorSettings.rsi.enabled}
                        onChange={() => handleIndicatorChange('rsi')}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingUp sx={{ mr: 1 }} />
                        <Typography>Relative Strength Index (RSI)</Typography>
                      </Box>
                    }
                  />
                </CardContent>
                {renderRSISettings()}
              </IndicatorCard>
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
                      // onChange={(e, newValue) => setStrategy({...strategy, position_size: newValue})}
                      onChange={(e) => setStrategy({
                        ...strategy,
                        exit_conditions: {
                          ...strategy.exit_conditions,
                          position_size_pct: e.target.value
                        }
                      })}
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
                      // onChange={(e, newValue) => setStrategy({...strategy, take_profit: newValue})}
                      onChange={(e) => setStrategy({
                        ...strategy,
                        exit_conditions: {
                          ...strategy.exit_conditions,
                          take_profit_pct: e.target.value
                        }
                      })}
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
                      // onChange={(e, newValue) => setStrategy({...strategy, stop_loss: newValue})}
                      onChange={(e) => setStrategy({
                        ...strategy,
                        exit_conditions: {
                          ...strategy.exit_conditions,
                          stop_loss_pct: e.target.value
                        }
                      })}
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