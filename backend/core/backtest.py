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
        
    def run(self) -> Dict:
        try:
            # Fetch historical data
            data = self.data_fetcher.get_historical_data(
                self.config.symbol,
                self.config.start_date,
                self.config.end_date
            )
            
            # Add technical indicators
            data = self.process_data(data)
            
            # Initialize portfolio tracking
            portfolio_values = []
            current_capital = self.initial_capital
            position_size = self.initial_capital * (self.config.position_size / 100)
            
            # Track trades and portfolio value
            for i in range(len(data)):
                current_data = data.iloc[:i+1]
                current_price = current_data['Close'].iloc[-1]
                
                # Check for exit if we have a position
                if self.current_position:
                    entry_price = self.current_position['entry_price']
                    # Check stop loss
                    stop_loss_price = entry_price * (1 - self.config.stop_loss / 100)
                    take_profit_price = entry_price * (1 + self.config.take_profit / 100)
                    
                    if current_price <= stop_loss_price or current_price >= take_profit_price:
                        # Close position
                        profit = (current_price - entry_price) * self.current_position['shares']
                        current_capital += self.current_position['shares'] * current_price
                        
                        self.trades_history.append({
                            'entry_date': self.current_position['entry_date'],
                            'exit_date': str(current_data.index[-1]),
                            'entry_price': entry_price,
                            'exit_price': current_price,
                            'position_size': self.current_position['shares'] * entry_price,
                            'profit': profit,
                            'status': 'closed'
                        })
                        self.current_position = None
                
                # Check for entry if we don't have a position
                elif self.strategy.check_entry(current_data):
                    shares = position_size / current_price
                    current_capital -= shares * current_price
                    
                    self.current_position = {
                        'entry_date': str(current_data.index[-1]),
                        'entry_price': current_price,
                        'shares': shares
                    }
                
                # Calculate current portfolio value
                portfolio_value = current_capital
                if self.current_position:
                    portfolio_value += self.current_position['shares'] * current_price
                
                portfolio_values.append(portfolio_value)
            
            # Calculate statistics
            statistics = self.calculate_statistics(portfolio_values)
            
            return {
                'returns': portfolio_values,
                'dates': [str(date) for date in data.index],
                'trades': self.trades_history,
                'statistics': statistics
            }
            
        except Exception as e:
            print(f"Backtest error: {str(e)}")
            raise e
    
    def process_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """Add technical indicators to the data"""
        df = data.copy()
        
        for indicator, params in self.config.indicators.items():
            if indicator.startswith('ma_'):
                period = params['period']
                df[f'MA_{period}'] = df['Close'].rolling(window=period).mean()
            elif indicator == 'rsi':
                period = params.get('period', 14)
                delta = df['Close'].diff()
                gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
                loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
                # Avoid division by zero
                rs = gain / loss.replace(0, float('inf'))
                df['RSI'] = 100 - (100 / (1 + rs))
                # Clean up any potential infinity values
                df['RSI'] = df['RSI'].replace([np.inf, -np.inf], 100)
                df['RSI'] = df['RSI'].fillna(50)  # Fill NaN values with neutral RSI
        
        return df
    
    def calculate_statistics(self, portfolio_values: List[float]) -> Dict:
        """Calculate backtest statistics"""
        returns = pd.Series(portfolio_values)
        returns_pct = returns.pct_change().dropna()
        
        # Avoid division by zero in case of identical values
        if len(returns) < 2 or returns.iloc[0] == returns.iloc[-1]:
            total_return = 0
        else:
            total_return = ((returns.iloc[-1] - returns.iloc[0]) / returns.iloc[0]) * 100
        
        statistics = {
            'total_return': total_return,
            'sharpe_ratio': self.calculate_sharpe_ratio(returns_pct),
            'max_drawdown': self.calculate_max_drawdown(returns),
            'win_rate': self.calculate_win_rate(),
            'total_trades': len(self.trades_history)
        }
        
        return statistics
    
    def calculate_sharpe_ratio(self, returns: pd.Series) -> float:
        if len(returns) < 2 or returns.std() == 0:
            return 0
        return np.sqrt(252) * (returns.mean() / returns.std())
    
    def calculate_max_drawdown(self, portfolio_values: pd.Series) -> float:
        if len(portfolio_values) < 2:
            return 0
        rolling_max = portfolio_values.expanding().max()
        # Avoid division by zero
        drawdowns = np.where(
            rolling_max == 0,
            0,
            (portfolio_values - rolling_max) / rolling_max * 100
        )
        return abs(float(min(drawdowns)))
    
    def calculate_win_rate(self) -> float:
        if not self.trades_history:
            return 0
        winning_trades = sum(1 for trade in self.trades_history if trade.get('profit', 0) > 0)
        return (winning_trades / len(self.trades_history)) * 100 