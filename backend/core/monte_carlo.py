import yfinance as yf
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from datetime import datetime, timedelta
import random
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor

from core.helpers.backtest_service import MonteCarloBacktestService, BacktestRequest

@dataclass
class MonteCarloResults:
    avg_return: float
    median_return: float
    highest_return: float
    worst_return: float
    avg_drawdown: float
    median_drawdown: float
    worst_drawdown: float
    win_rate: float
    sharpe_ratio: float
    simulation_count: int
    successful_simulations: int

class MonteCarloSimulator:
    def __init__(self, lookback_years: int = 10, simulation_length_days: int = 252):
        self.lookback_years = lookback_years
        self.simulation_length_days = simulation_length_days

    def get_historical_data(self, symbol: str) -> pd.DataFrame:
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=self.lookback_years * 365)
            
            ticker = yf.Ticker(symbol)
            df = ticker.history(start=start_date, end=end_date, interval="1d")
            
            if df.empty:
                raise ValueError(f"No historical data found for symbol {symbol}")
                
            print(f"Successfully fetched {len(df)} data points for {symbol}")
            print(f"Date range: {df.index[0]} to {df.index[-1]}")
            return df
        except Exception as e:
            raise ValueError(f"Error fetching historical data for {symbol}: {str(e)}")

    def calculate_sma(self, data: pd.DataFrame, period: int) -> pd.Series:
        return data['Close'].rolling(window=period).mean()

    def calculate_ema(self, data: pd.DataFrame, period: int) -> pd.Series:
        return data['Close'].ewm(span=period, adjust=False).mean()

    def calculate_rsi(self, data: pd.DataFrame, period: int) -> pd.Series:
        delta = data['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))

    def calculate_macd(self, df: pd.DataFrame, short_period=12, long_period=26):
        short_ema = df['Close'].ewm(span=short_period, adjust=False).mean()
        long_ema = df['Close'].ewm(span=long_period, adjust=False).mean()
        return short_ema - long_ema

    def calculate_signal_line(self, df: pd.DataFrame, macd_column='MACD', signal_period=9):
        return df[macd_column].ewm(span=signal_period, adjust=False).mean()

    def calculate_bollinger_bands(self, data: pd.DataFrame, period: int, std_dev: float) -> pd.DataFrame:
        middle = data['Close'].rolling(window=period).mean()
        std = data['Close'].rolling(window=period).std()
        upper = middle + (std * std_dev)
        lower = middle - (std * std_dev)
        
        bandwidth = ((upper - lower) / middle) * 100
        percent_b = (data['Close'] - lower) / (upper - lower)
        typical_price = (data['High'] + data['Low'] + data['Close']) / 3
        
        return pd.DataFrame({
            'BB_middle': middle,
            'BB_upper': upper,
            'BB_lower': lower,
            'BB_bandwidth': bandwidth,
            'BB_percent_b': percent_b,
            'BB_typical_price': typical_price
        })

    def calculate_adx(self, data: pd.DataFrame, period: int) -> pd.Series:
        # Calculate True Range and Directional Movement
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

        # Calculate smoothed TR and DM
        data['TR14'] = data['TR'].ewm(span=period, min_periods=period).mean()
        data['+DM14'] = data['+DM'].ewm(span=period, min_periods=period).mean()
        data['-DM14'] = data['-DM'].ewm(span=period, min_periods=period).mean()

        # Calculate DI
        data['+DI14'] = 100 * (data['+DM14'] / data['TR14'])
        data['-DI14'] = 100 * (data['-DM14'] / data['TR14'])

        # Calculate DX and ADX
        data['DX'] = 100 * abs(data['+DI14'] - data['-DI14']) / (data['+DI14'] + data['-DI14'])
        adx = data['DX'].ewm(span=period, min_periods=period).mean()

        return adx

    def add_indicators(self, df: pd.DataFrame, entry_conditions) -> pd.DataFrame:
        """Add all necessary indicators based on entry conditions"""
        if entry_conditions.ma_condition:
            ma_cond = entry_conditions.ma_condition
            period = ma_cond.period
            
            if ma_cond.ma_type == "SMA":
                df[f'MA_{period}'] = self.calculate_sma(df, period)
            else:  # EMA
                df[f'MA_{period}'] = self.calculate_ema(df, period)
                
            deviation = ma_cond.deviation_pct / 100
            df[f'MA_{period}_upper'] = df[f'MA_{period}'] * (1 + deviation)
            df[f'MA_{period}_lower'] = df[f'MA_{period}'] * (1 - deviation)

        if entry_conditions.rsi_condition:
            period = entry_conditions.rsi_condition.period
            df[f'RSI_{period}'] = self.calculate_rsi(df, period)

        if entry_conditions.macd_condition:
            df['MACD'] = self.calculate_macd(df)
            df['Signal_Line'] = self.calculate_signal_line(df)
            df['MACD_Histogram'] = df['MACD'] - df['Signal_Line']

            if hasattr(entry_conditions.macd_condition, 'crossover'):
                if entry_conditions.macd_condition.crossover == "BULLISH":
                    df['MACD_Crossover'] = (df['MACD'].shift(1) < df['Signal_Line'].shift(1)) & (df['MACD'] > df['Signal_Line'])
                elif entry_conditions.macd_condition.crossover == "BEARISH":
                    df['MACD_Crossover'] = (df['MACD'].shift(1) > df['Signal_Line'].shift(1)) & (df['MACD'] < df['Signal_Line'])

            if hasattr(entry_conditions.macd_condition, 'histogram_positive'):
                df['MACD_Histogram_Positive'] = df['MACD_Histogram'] > 0

            if hasattr(entry_conditions.macd_condition, 'macd_comparison'):
                if entry_conditions.macd_condition.macd_comparison == "ABOVE_ZERO":
                    df['MACD_Above_Zero'] = df['MACD'] > 0

        if entry_conditions.bb_condition:
            bb_cond = entry_conditions.bb_condition
            bb_df = self.calculate_bollinger_bands(df, bb_cond.period, bb_cond.std_dev)
            
            for col in bb_df.columns:
                df[col] = bb_df[col]

        if entry_conditions.adx_condition:
            period = entry_conditions.adx_condition.period
            df['ADX'] = self.calculate_adx(df, period)

        return df

    def calculate_sharpe_ratio(self, returns: List[float], risk_free_rate: float = 0.02) -> float:
        """Calculate Sharpe ratio for the simulation results"""
        returns_array = np.array(returns)
        excess_returns = returns_array - risk_free_rate
        if len(excess_returns) > 0:
            return np.mean(excess_returns) / np.std(excess_returns) if np.std(excess_returns) != 0 else 0
        return 0
    
    def generate_simulation_data(self, historical_data: pd.DataFrame, entry_conditions) -> pd.DataFrame:
        try:
            if historical_data.empty:
                raise ValueError("Historical data is empty")
            
            required_columns = ['Open', 'High', 'Low', 'Close']
            missing_columns = [col for col in required_columns if col not in historical_data.columns]
            if missing_columns:
                raise ValueError(f"Missing required columns: {missing_columns}")
                    
            returns = historical_data['Close'].pct_change().dropna()
            if len(returns) == 0:
                raise ValueError("No valid returns calculated from historical data")
            
            std_dev = returns.std()
            returns = returns[abs(returns) <= 5 * std_dev]
            
            if len(returns) < 100:
                raise ValueError("Insufficient valid return data points after filtering")
                    
            random_returns = np.random.choice(returns.values, size=self.simulation_length_days)
            
            initial_price = historical_data['Close'].iloc[-1]
            if pd.isna(initial_price) or initial_price <= 0:
                raise ValueError("Invalid initial price")
                
            prices = [initial_price]
            for r in random_returns:
                new_price = prices[-1] * (1 + r)
                if new_price <= 0:
                    new_price = prices[-1] * 0.5
                prices.append(new_price)
            
            dates = pd.date_range(start=datetime.now(), periods=self.simulation_length_days + 1, freq='B')
            simulated_data = pd.DataFrame(index=dates)
            simulated_data['Close'] = prices
            
            simulated_data['Open'] = simulated_data['Close'].shift(1)
            simulated_data['High'] = simulated_data[['Open', 'Close']].max(axis=1) * 1.002
            simulated_data['Low'] = simulated_data[['Open', 'Close']].min(axis=1) * 0.998
            
            simulated_data.iloc[0, simulated_data.columns.get_loc('Open')] = initial_price

            # Add indicators based on entry conditions
            if entry_conditions.ma_condition:
                ma_cond = entry_conditions.ma_condition
                period = ma_cond.period
                
                if ma_cond.ma_type == "SMA":
                    simulated_data[f'MA_{period}'] = simulated_data['Close'].rolling(window=period).mean()
                else:
                    simulated_data[f'MA_{period}'] = simulated_data['Close'].ewm(span=period, adjust=False).mean()
                    
                deviation = ma_cond.deviation_pct / 100
                simulated_data[f'MA_{period}_upper'] = simulated_data[f'MA_{period}'] * (1 + deviation)
                simulated_data[f'MA_{period}_lower'] = simulated_data[f'MA_{period}'] * (1 - deviation)

            if entry_conditions.rsi_condition:
                period = entry_conditions.rsi_condition.period
                simulated_data[f'RSI_{period}'] = self.calculate_rsi(simulated_data, period)

            if entry_conditions.macd_condition:
                simulated_data['MACD'] = self.calculate_macd(simulated_data)
                simulated_data['Signal_Line'] = self.calculate_signal_line(simulated_data)
                simulated_data['MACD_Histogram'] = simulated_data['MACD'] - simulated_data['Signal_Line']
                
                if hasattr(entry_conditions.macd_condition, 'crossover'):
                    if entry_conditions.macd_condition.crossover == "BULLISH":
                        simulated_data['MACD_Crossover'] = (simulated_data['MACD'].shift(1) < simulated_data['Signal_Line'].shift(1)) & (simulated_data['MACD'] > simulated_data['Signal_Line'])
                    elif entry_conditions.macd_condition.crossover == "BEARISH":
                        simulated_data['MACD_Crossover'] = (simulated_data['MACD'].shift(1) > simulated_data['Signal_Line'].shift(1)) & (simulated_data['MACD'] < simulated_data['Signal_Line'])

            if entry_conditions.bb_condition:
                bb_cond = entry_conditions.bb_condition
                bb_df = self.calculate_bollinger_bands(simulated_data, bb_cond.period, bb_cond.std_dev)
                for col in bb_df.columns:
                    simulated_data[col] = bb_df[col]

            if entry_conditions.adx_condition:
                period = entry_conditions.adx_condition.period
                adx = self.calculate_adx(simulated_data, period)
                simulated_data['ADX'] = adx
                
            return simulated_data.dropna()
            
        except Exception as e:
            raise ValueError(f"Error generating simulation data: {str(e)}")
    
    def run_single_simulation(self, historical_data: pd.DataFrame, backtest_request: BacktestRequest) -> Dict[str, float]:
        try:
            simulated_data = self.generate_simulation_data(historical_data, backtest_request.entry_conditions)
            
            simulation_request = BacktestRequest(
                symbol=backtest_request.symbol,
                start_date=simulated_data.index[0].strftime('%Y-%m-%d'),
                end_date=simulated_data.index[-1].strftime('%Y-%m-%d'),
                timeframe=backtest_request.timeframe,
                initial_capital=backtest_request.initial_capital,
                entry_conditions=backtest_request.entry_conditions.dict() if hasattr(backtest_request.entry_conditions, 'dict') else backtest_request.entry_conditions.model_dump(),
                exit_conditions=backtest_request.exit_conditions.dict() if hasattr(backtest_request.exit_conditions, 'dict') else backtest_request.exit_conditions.model_dump()
            )
            
            monte_carlo_backtester = MonteCarloBacktestService(debug=False)
            results = monte_carlo_backtester.run_backtest_on_simulated_data(
                simulated_data=simulated_data,
                request=simulation_request
            )
            
            if isinstance(results, dict) and 'total_return_pct' in results:
                return {
                    'return': results['total_return_pct'],
                    'drawdown': results['max_drawdown_pct'],
                    'win_rate': results['win_rate'] if 'win_rate' in results else 0.0,
                    'trade_count': results['total_trades'],
                    'avg_profit': results['avg_profit'],
                    'avg_loss': results['avg_loss']
                }
            return None
        except Exception as e:
            print(f"Simulation failed: {str(e)}")
            return None
    
    def run_simulations(self, backtest_request: BacktestRequest, num_simulations: int = 500) -> MonteCarloResults:
        """Run multiple simulations and aggregate results"""
        try:
            historical_data = self.get_historical_data(backtest_request.symbol)
            print(f"Running {num_simulations} simulations for {backtest_request.symbol}")
            
            simulation_results = []
            failed_simulations = 0
            
            # Run simulations in parallel
            with ThreadPoolExecutor(max_workers=min(num_simulations, 10)) as executor:
                futures = []
                for i in range(num_simulations):
                    future = executor.submit(self.run_single_simulation, historical_data, backtest_request)
                    futures.append(future)
                
                for future in futures:
                    try:
                        result = future.result()
                        if result is not None:
                            simulation_results.append(result)
                        else:
                            failed_simulations += 1
                    except Exception as e:
                        print(f"Simulation failed: {str(e)}")
                        failed_simulations += 1
            
            if not simulation_results:
                raise ValueError(f"All {num_simulations} simulations failed to complete")
            
            print(f"Completed {len(simulation_results)} successful simulations")
            print(f"Failed simulations: {failed_simulations}")
            
            # Extract metrics
            returns = [r['return'] for r in simulation_results]
            drawdowns = [r['drawdown'] for r in simulation_results]
            win_rates = [r['win_rate'] for r in simulation_results]
            
            # Calculate additional statistics
            avg_trade_count = np.mean([r['trade_count'] for r in simulation_results])
            avg_profit = np.mean([r['avg_profit'] for r in simulation_results])
            avg_loss = np.mean([r['avg_loss'] for r in simulation_results])
            
            # Calculate Sharpe ratio
            sharpe_ratio = self.calculate_sharpe_ratio(returns)
            
            # Print summary statistics
            print("\nMonte Carlo Simulation Summary:")
            print(f"Average Trade Count: {avg_trade_count:.2f}")
            print(f"Average Win Rate: {np.mean(win_rates):.2f}%")
            print(f"Average Profit per Trade: ${avg_profit:.2f}")
            print(f"Average Loss per Trade: ${avg_loss:.2f}")
            
            return MonteCarloResults(
                avg_return=np.mean(returns),
                median_return=np.median(returns),
                highest_return=max(returns),
                worst_return=min(returns),
                avg_drawdown=np.mean(drawdowns),
                median_drawdown=np.median(drawdowns),
                worst_drawdown=max(drawdowns),
                win_rate=np.mean(win_rates),
                sharpe_ratio=sharpe_ratio,
                simulation_count=num_simulations,
                successful_simulations=len(simulation_results)
            )
        except Exception as e:
            raise ValueError(f"Error running simulations: {str(e)}")
    
"""

{
  "lookback_years": 10,
  "simulation_length_days": 252,
  "num_simulations": 500,
  "backtest_request": {
    "symbol": "SPY",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "timeframe": "1d",
    "initial_capital": 10000,
    "entry_conditions": {
      "ma_condition": {
        "period": 20,
        "ma_type": "SMA",
        "comparison": "BELOW",
        "deviation_pct": 0
      },
      "rsi_condition": {
        "period": 14,
        "comparison": "BELOW",
        "value": 30
      },
      "trade_direction": "BUY"
    },
    "exit_conditions": {
      "stop_loss_pct": 10,
      "take_profit_pct": 2,
      "position_size_pct": 5
    }
  }
}


"""