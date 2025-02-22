import pandas as pd
import numpy as np
from typing import Dict, Any

class Indicators:
    @staticmethod
    def moving_average(data: pd.Series, period: int) -> pd.Series:
        return data.rolling(window=period).mean()
    
    @staticmethod
    def rsi(data: pd.Series, period: int = 14) -> pd.Series:
        delta = data.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))
    
    @staticmethod
    def fibonacci_bands(data: pd.Series) -> Dict[str, pd.Series]:
        high = data.rolling(window=20).max()
        low = data.rolling(window=20).min()
        diff = high - low
        
        return {
            'upper_3': high + diff * 1.618,
            'upper_2': high + diff * 1.272,
            'upper_1': high + diff * 0.618,
            'middle': (high + low) / 2,
            'lower_1': low - diff * 0.618,
            'lower_2': low - diff * 1.272,
            'lower_3': low - diff * 1.618
        }

    @staticmethod
    def calculate_indicators(data: pd.DataFrame, config: Dict[str, Any]) -> pd.DataFrame:
        df = data.copy()
        
        for indicator, params in config.items():
            if indicator.startswith('ma_'):
                period = params['period']
                df[indicator] = Indicators.moving_average(df['Close'], period)
            elif indicator == 'rsi':
                period = params.get('period', 14)
                df[indicator] = Indicators.rsi(df['Close'], period)
            elif indicator == 'fibonacci':
                bands = Indicators.fibonacci_bands(df['Close'])
                for name, series in bands.items():
                    df[f'fib_{name}'] = series
                    
        return df 