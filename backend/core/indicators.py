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
    def calculate_macd(df, short_period=12, long_period=26):
        short_ema = df['Close'].ewm(span=short_period, adjust=False).mean() # calculate the exponental weighted movement to short
        long_ema = df['Close'].ewm(span=long_period, adjust=False).mean() # calculate the exponential weighted movement for long
        return short_ema - long_ema # subtract them
    
    @staticmethod
    def calculate_signal_line(df, macd_column='MACD', signal_period=9): # need the signal line to predict divergence
        return df[macd_column].ewm(span=signal_period, adjust=False).mean()

    @staticmethod
    def calculate_macd_divergence(df, divergence_type='BULLISH'):
        price_trend = df['Close'].diff()
        macd_trend = df['MACD'].diff()
        if divergence_type == 'BULLISH':
            return (price_trend < 0) & (macd_trend > 0)
        elif divergence_type == 'BEARISH':
            return (price_trend > 0) & (macd_trend < 0)
        return None

    @staticmethod
    def add_indicators(df: pd.DataFrame, ma_condition=None, rsi_condition=None, macd_condition = None) -> pd.DataFrame:
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

        if macd_condition:
            #macd and signal line
            df['MACD'] = Indicators.calculate_macd(df)
            df['Signal_Line'] = Indicators.calculate_signal_line(df)

            #histogram
            df['MACD_Histogram'] = df['MACD'] - df['Signal_Line']

            ###macd conditions
            if hasattr(macd_condition, 'crossover'): # hasattribute
                if macd_condition.crossover == "BULLISH":
                    df['MACD_Crossover'] = (df['MACD'].shift(1) < df['Signal_Line'].shift(1)) & (df['MACD'] > df['Signal_Line'])
                elif macd_condition.crossover == "BEARISH":
                    df['MACD_Crossover'] = (df['MACD'].shift(1) > df['Signal_Line'].shift(1)) & (df['MACD'] < df['Signal_Line'])

            if hasattr(macd_condition, 'histogram_positive'):
                df['MACD_Histogram_Positive'] = df['MACD_Histogram'] > 0

            if hasattr(macd_condition, 'macd_above_zero'):
                df['MACD_Above_Zero'] = df['MACD'] > 0

            if hasattr(macd_condition, 'divergence'):
                df['MACD_Divergence'] = Indicators.calculate_macd_divergence(df, macd_condition.divergence)

            if hasattr(macd_condition, 'macd_signal_deviation_pct'):
                deviation = macd_condition.macd_signal_deviation_pct / 100
                df['MACD_Signal_Deviation'] = abs(df['MACD'] - df['Signal_Line']) > (df['Signal_Line'] * deviation)
            
            
        return df 