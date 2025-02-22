from typing import Dict, List, Tuple
import pandas as pd
import numpy as np
from .strategy import Strategy
from data.stock_data import StockDataFetcher
from api.models import StrategyConfig

class Backtester:
    def __init__(self, config: StrategyConfig):
        self.config = config
        self.strategy = Strategy(config.dict())
        self.data_fetcher = StockDataFetcher()
        self.initial_capital = 100000  # Starting with $100k
        self.current_position = None
        self.trades_history = []
        self.portfolio_values = []
        
    def process_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """Add technical indicators to the data"""
        df = data.copy()
        
        for indicator_type, settings in self.config.indicators.items():
            settings_dict = settings.dict() if hasattr(settings, 'dict') else settings
            
            if indicator_type == 'sma':
                period = settings_dict.get('period', 20)
                df[f'SMA_{period}'] = df['Close'].rolling(window=period).mean()
                # Calculate deviation bands
                deviation = settings_dict.get('deviation', 0) / 100  # Convert percentage to decimal
                df[f'SMA_{period}_upper'] = df[f'SMA_{period}'] * (1 + deviation)
                df[f'SMA_{period}_lower'] = df[f'SMA_{period}'] * (1 - deviation)
                
            elif indicator_type == 'ema':
                period = settings_dict.get('period', 20)
                df[f'EMA_{period}'] = df['Close'].ewm(span=period, adjust=False).mean()
                # Calculate deviation bands
                deviation = settings_dict.get('deviation', 0) / 100  # Convert percentage to decimal
                df[f'EMA_{period}_upper'] = df[f'EMA_{period}'] * (1 + deviation)
                df[f'EMA_{period}_lower'] = df[f'EMA_{period}'] * (1 - deviation)
                
            elif indicator_type == 'rsi':
                period = settings_dict.get('period', 14)
                delta = df['Close'].diff()
                gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
                loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
                # Avoid division by zero
                rs = gain / loss.replace(0, float('inf'))
                df['RSI'] = 100 - (100 / (1 + rs))
                # Clean up any potential infinity values
                df['RSI'] = df['RSI'].replace([np.inf, -np.inf], 100)
                df['RSI'] = df['RSI'].fillna(50)  # Fill NaN values with neutral RSI
                
            elif indicator_type == 'bollinger':
                period = settings_dict.get('period', 20)
                std_dev = settings_dict.get('stdDev', 2)
                
                # Calculate middle band (SMA)
                df['BB_middle'] = df['Close'].rolling(window=period).mean()
                
                # Calculate standard deviation
                rolling_std = df['Close'].rolling(window=period).std()
                
                # Calculate upper and lower bands
                df['BB_upper'] = df['BB_middle'] + (rolling_std * std_dev)
                df['BB_lower'] = df['BB_middle'] - (rolling_std * std_dev)
        
        return df

    def run(self) -> Dict:
        """Run the backtest"""
        # Get historical data
        data = self.data_fetcher.get_historical_data(
            symbol=self.config.symbol,
            start_date=self.config.start_date,
            end_date=self.config.end_date
        )
        
        if data.empty:
            raise ValueError("No data available for the specified period")
            
        # Add technical indicators
        data = self.process_data(data)
        
        # Initialize portfolio tracking
        portfolio_value = self.initial_capital
        self.portfolio_values = [portfolio_value]
        self.trades_history = []
        
        # Iterate through each day
        for i in range(1, len(data)):
            current_data = data.iloc[:i+1]
            current_price = current_data['Close'].iloc[-1]
            
            # Check for exit if we have a position
            if self.current_position:
                if self.should_exit(current_price):
                    portfolio_value = self.exit_position(current_price, data.index[i])
            
            # Check for entry if we don't have a position
            elif self.strategy.check_entry(current_data):
                self.enter_position(current_price, data.index[i])
            
            # Update portfolio value
            if self.current_position:
                portfolio_value = self.initial_capital + (
                    self.current_position['size'] * 
                    (current_price - self.current_position['entry_price'])
                )
            self.portfolio_values.append(portfolio_value)
        
        # Calculate final statistics
        return self.calculate_results(data.index)

    def enter_position(self, price: float, date) -> None:
        position_size = (self.initial_capital * self.config.position_size / 100) / price
        self.current_position = {
            'entry_price': price,
            'size': position_size,
            'entry_date': date
        }

    def exit_position(self, price: float, date) -> float:
        profit = (price - self.current_position['entry_price']) * self.current_position['size']
        self.trades_history.append({
            'entry_date': self.current_position['entry_date'],
            'exit_date': date,
            'entry_price': self.current_position['entry_price'],
            'exit_price': price,
            'profit': profit,
            'return': (profit / self.initial_capital) * 100
        })
        portfolio_value = self.initial_capital + profit
        self.current_position = None
        return portfolio_value

    def should_exit(self, current_price: float) -> bool:
        if not self.current_position:
            return False
            
        entry_price = self.current_position['entry_price']
        profit_pct = (current_price - entry_price) / entry_price * 100
        
        # Check take profit and stop loss
        return (profit_pct >= self.config.take_profit or 
                profit_pct <= -self.config.stop_loss)

    def calculate_results(self, dates) -> Dict:
        # Calculate various performance metrics
        returns = np.array(self.portfolio_values) / self.initial_capital * 100 - 100
        
        return {
            'returns': returns.tolist(),
            'dates': [d.strftime('%Y-%m-%d') for d in dates],
            'trades': self.trades_history,
            'statistics': {
                'total_return': returns[-1],
                'max_drawdown': self.calculate_max_drawdown(),
                'win_rate': self.calculate_win_rate(),
                'total_trades': len(self.trades_history),
                'sharpe_ratio': self.calculate_sharpe_ratio(returns),
                'volatility': np.std(returns) if len(returns) > 1 else 0
            }
        }

    def calculate_sharpe_ratio(self, returns: np.ndarray) -> float:
        if len(returns) < 2:
            return 0
        # Assuming risk-free rate of 2%
        risk_free_rate = 2
        excess_returns = returns - risk_free_rate
        return np.mean(excess_returns) / np.std(excess_returns) if np.std(excess_returns) != 0 else 0

    def calculate_max_drawdown(self) -> float:
        portfolio_values = np.array(self.portfolio_values)
        rolling_max = np.maximum.accumulate(portfolio_values)
        drawdowns = (portfolio_values - rolling_max) / rolling_max * 100
        return abs(float(min(drawdowns)))
    
    def calculate_win_rate(self) -> float:
        if not self.trades_history:
            return 0
        winning_trades = sum(1 for trade in self.trades_history if trade['profit'] > 0)
        return (winning_trades / len(self.trades_history)) * 100 