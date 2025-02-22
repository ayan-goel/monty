from dataclasses import dataclass
from typing import Dict, List
import pandas as pd
import numpy as np

@dataclass
class Strategy:
    def __init__(self, config: dict):
        self.indicators = config['indicators']
        self.position_size = config['position_size']
        self.take_profit = config['take_profit']
        self.stop_loss = config['stop_loss']
    
    def check_entry(self, data: pd.DataFrame) -> bool:
        """
        Check if we should enter a trade based on the strategy rules
        """
        if len(data) < 50:  # Need enough data for indicators
            return False
            
        current_price = data['Close'].iloc[-1]
        
        # Check MA crossover if MAs are selected
        if 'ma_20' in self.indicators and 'ma_50' in self.indicators:
            ma_20 = data.get('MA_20', pd.Series([np.nan]))
            ma_50 = data.get('MA_50', pd.Series([np.nan]))
            
            # Make sure we have at least 2 data points and no NaN values
            if (len(ma_20) < 2 or len(ma_50) < 2 or
                pd.isna(ma_20.iloc[-1]) or pd.isna(ma_20.iloc[-2]) or
                pd.isna(ma_50.iloc[-1]) or pd.isna(ma_50.iloc[-2])):
                return False
            
            if not (ma_20.iloc[-1] > ma_50.iloc[-1] and 
                    ma_20.iloc[-2] <= ma_50.iloc[-2]):
                return False
            
        # Check RSI if selected
        if 'rsi' in self.indicators:
            rsi = data.get('RSI', pd.Series([50]))
            if pd.isna(rsi.iloc[-1]):  # Skip if RSI is NaN
                return False
            if rsi.iloc[-1] < 30 or rsi.iloc[-1] > 70:
                return False
        
        # Check Bollinger Bands if selected
        if 'bollinger' in self.indicators:
            bb_lower = data.get('BB_lower', pd.Series([np.nan]))
            bb_upper = data.get('BB_upper', pd.Series([np.nan]))
            
            if pd.isna(bb_lower.iloc[-1]) or pd.isna(bb_upper.iloc[-1]):
                return False
            
            # Example entry condition: price crosses below lower band
            if not (current_price <= bb_lower.iloc[-1] and 
                    data['Close'].iloc[-2] > bb_lower.iloc[-2]):
                return False
        
        return True
    
    def check_exit(self, position, current_price: float) -> bool:
        # Implement exit logic based on take profit/stop loss
        pass 