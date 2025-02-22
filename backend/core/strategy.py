from dataclasses import dataclass
from typing import Dict, List
import pandas as pd
import numpy as np

@dataclass
class Strategy:
    def __init__(self, config: dict):
        # Convert indicators to a dictionary if they're not already
        self.indicators = {}
        for k, v in config['indicators'].items():
            if hasattr(v, 'dict'):
                self.indicators[k] = v.dict()
            elif isinstance(v, dict):
                self.indicators[k] = v
            else:
                raise ValueError(f"Invalid indicator settings for {k}")
                
        self.position_size = config['position_size']
        self.take_profit = config['take_profit']
        self.stop_loss = config['stop_loss']
    
    def check_entry(self, data: pd.DataFrame) -> bool:
        """
        Check if we should enter a trade based on the strategy rules
        """
        if len(data) < 2:  # Need at least 2 data points for crossovers
            return False
            
        current_price = data['Close'].iloc[-1]
        prev_price = data['Close'].iloc[-2]
        
        # Check each enabled indicator
        for indicator_type, settings in self.indicators.items():
            if not self._check_indicator_condition(data, indicator_type, settings):
                return False
        
        return True
    
    def _check_indicator_condition(self, data: pd.DataFrame, indicator_type: str, settings: dict) -> bool:
        """Check conditions for a specific indicator"""
        current_price = data['Close'].iloc[-1]
        prev_price = data['Close'].iloc[-2]
        
        if indicator_type == 'sma':
            period = settings.get('period', 20)
            ma_col = f'SMA_{period}'
            if pd.isna(data[ma_col].iloc[-1]):
                return False
            
            cross_direction = settings.get('crossDirection', 'above')
            deviation = settings.get('deviation', 0) / 100
            ma_value = data[ma_col].iloc[-1]
            
            if cross_direction == 'above':
                return current_price > ma_value * (1 + deviation)
            else:
                return current_price < ma_value * (1 - deviation)
            
        elif indicator_type == 'ema':
            period = settings.get('period', 20)
            ma_col = f'EMA_{period}'
            if pd.isna(data[ma_col].iloc[-1]):
                return False
            
            cross_direction = settings.get('crossDirection', 'above')
            deviation = settings.get('deviation', 0) / 100
            ma_value = data[ma_col].iloc[-1]
            
            if cross_direction == 'above':
                return current_price > ma_value * (1 + deviation)
            else:
                return current_price < ma_value * (1 - deviation)
            
        elif indicator_type == 'rsi':
            if pd.isna(data['RSI'].iloc[-1]):
                return False
                
            current_rsi = data['RSI'].iloc[-1]
            prev_rsi = data['RSI'].iloc[-2]
            threshold = settings.get('threshold', 70)
            condition = settings.get('condition', 'crosses_above')
            
            if condition == 'crosses_above':
                return current_rsi > threshold and prev_rsi <= threshold
            elif condition == 'crosses_below':
                return current_rsi < threshold and prev_rsi >= threshold
            elif condition == 'above':
                return current_rsi > threshold
            elif condition == 'below':
                return current_rsi < threshold
            
        elif indicator_type == 'bollinger':
            if any(pd.isna(data[col].iloc[-1]) for col in ['BB_upper', 'BB_middle', 'BB_lower']):
                return False
                
            condition = settings.get('condition', 'crosses_below')
            
            if condition == 'crosses_above':
                return (current_price > data['BB_upper'].iloc[-1] and 
                        prev_price <= data['BB_upper'].iloc[-2])
            elif condition == 'crosses_below':
                return (current_price < data['BB_lower'].iloc[-1] and 
                        prev_price >= data['BB_lower'].iloc[-2])
            elif condition == 'inside_bands':
                return (data['BB_lower'].iloc[-1] < current_price < data['BB_upper'].iloc[-1])
            elif condition == 'outside_bands':
                return (current_price > data['BB_upper'].iloc[-1] or 
                        current_price < data['BB_lower'].iloc[-1])
        
        return True
    
    def check_exit(self, position, current_price: float) -> bool:
        # Implement exit logic based on take profit/stop loss
        pass 