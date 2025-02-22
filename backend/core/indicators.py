import pandas as pd
import numpy as np
from typing import Dict, Any

class Indicators:
    @staticmethod
    def calculate_sma(data: pd.DataFrame, period: int) -> pd.Series:
        return data['Close'].rolling(window=period).mean()

    @staticmethod
    def calculate_ema(data: pd.DataFrame, period: int) -> pd.Series:
        return data['Close'].ewm(span=period, adjust=False).mean()

    @staticmethod
    def calculate_rsi(data: pd.DataFrame, period: int) -> pd.Series:
        delta = data['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))

    @staticmethod
    def add_indicators(df: pd.DataFrame, ma_condition=None, rsi_condition=None) -> pd.DataFrame:
        """Add technical indicators based on conditions"""
        if ma_condition:
            period = ma_condition.period
            
            if ma_condition.ma_type == "SMA":
                df[f'MA_{period}'] = Indicators.calculate_sma(df, period)
            else:  # EMA
                df[f'MA_{period}'] = Indicators.calculate_ema(df, period)
                
            deviation = ma_condition.deviation_pct / 100
            df[f'MA_{period}_upper'] = df[f'MA_{period}'] * (1 + deviation)
            df[f'MA_{period}_lower'] = df[f'MA_{period}'] * (1 - deviation)

        if rsi_condition:
            period = rsi_condition.period
            df[f'RSI_{period}'] = Indicators.calculate_rsi(df, period)
            
        return df 