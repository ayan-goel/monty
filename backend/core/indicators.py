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
    def calculate_adx(self, data: pd.DataFrame, period: int) -> pd.Series:
        data['TR'] = np.maximum(
            data['High'] - data['Low'],
            np.maximum(
                abs(data['High'] - data['Close'].shift(1)),
                abs(data['Low'] - data['Close'].shift(1))
            )
        )

        data['+DM'] = np.where(
            (data['High'] - data['High'].shift(1)) > (data['Low'].shift(1) - data['Low']),
            np.maximum(data['High'] - data['High'].shift(1), 0),
            0
        )

        data['-DM'] = np.where(
            (data['Low'].shift(1) - data['Low']) > (data['High'] - data['High'].shift(1)),
            np.maximum(data['Low'].shift(1) - data['Low'], 0),
            0
        )

        data['TR14'] = data['TR'].ewm(span=period, min_periods=period).mean()
        data['+DM14'] = data['+DM'].ewm(span=period, min_periods=period).mean()
        data['-DM14'] = data['-DM'].ewm(span=period, min_periods=period).mean()

        data['+DI14'] = 100 * (data['+DM14'] / data['TR14'])
        data['-DI14'] = 100 * (data['-DM14'] / data['TR14'])

        data['DX'] = 100 * abs(data['+DI14'] - data['-DI14']) / (data['+DI14'] + data['-DI14'])
        adx = data['DX'].ewm(span=period, min_periods=period).mean()

        return adx

    def calculate_bollinger_bands(self, data: pd.DataFrame, period: int, std_dev: float) -> pd.DataFrame:
        middle = data['Close'].rolling(window=period).mean()
        std = data['Close'].rolling(window=period).std()
        upper = middle + (std * std_dev)
        lower = middle - (std * std_dev)

        # calc bandwidth (volatility indicator)
        bandwidth = ((upper - lower) / middle) * 100

        # calc %B (position within bands)
        percent_b = (data['Close'] - lower) / (upper - lower)

        # calc typical price
        typical_price = (data['High'] + data['Low'] + data['Close']) / 3

        return pd.DataFrame({
            'BB_middle': middle,
            'BB_upper': upper,
            'BB_lower': lower,
            'BB_bandwidth': bandwidth,
            'BB_percent_b': percent_b,
            'BB_typical_price': typical_price
        })


    @staticmethod
    def add_indicators(df: pd.DataFrame, ma_condition=None, rsi_condition=None, 
                    macd_condition=None, bb_condition=None, adx_condition=None) -> pd.DataFrame:
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
            # MACD and signal line
            df['MACD'] = Indicators.calculate_macd(df)
            df['Signal_Line'] = Indicators.calculate_signal_line(df)
            df['MACD_Histogram'] = df['MACD'] - df['Signal_Line']

            if hasattr(macd_condition, 'crossover'):
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

        if bb_condition:
            period = bb_condition.params.get('period', 20)
            std_dev = bb_condition.params.get('std_dev', 2.0)
            
            bb_df = Indicators.calculate_bollinger_bands(df, period, std_dev)
            df['BB_middle'] = bb_df['BB_middle']
            df['BB_upper'] = bb_df['BB_upper']
            df['BB_lower'] = bb_df['BB_lower']
            df['BB_bandwidth'] = bb_df['BB_bandwidth']
            df['BB_percent_b'] = bb_df['BB_percent_b']
            df['BB_typical_price'] = bb_df['BB_typical_price']

            # Add BB crossover signals if needed
            df['BB_Cross_Middle_Up'] = (df['Close'].shift(1) <= df['BB_middle'].shift(1)) & (df['Close'] > df['BB_middle'])
            df['BB_Cross_Middle_Down'] = (df['Close'].shift(1) >= df['BB_middle'].shift(1)) & (df['Close'] < df['BB_middle'])
            df['BB_Above_Upper'] = df['Close'] > df['BB_upper']
            df['BB_Below_Lower'] = df['Close'] < df['BB_lower']

        if adx_condition:
            period = adx_condition.params.get('period', 14)
            df['ADX'] = Indicators.calculate_adx(df, period)
            
            # Add common ADX signals
            df['ADX_Strong_Trend'] = df['ADX'] > 25
            df['+DI_Cross_Above'] = (df['+DI14'].shift(1) <= df['-DI14'].shift(1)) & (df['+DI14'] > df['-DI14'])
            df['-DI_Cross_Above'] = (df['+DI14'].shift(1) >= df['-DI14'].shift(1)) & (df['+DI14'] < df['-DI14'])
        
        return df