import numpy as np
import pandas as pd
from typing import Dict, List
from .backtest import Backtester
from data.stock_data import StockDataFetcher

class MonteCarloSimulator:
    def __init__(self, config: Dict):
        self.config = config
        self.n_simulations = 1000
        self.base_backtester = Backtester(config)
        self.data_fetcher = StockDataFetcher()
    
    def run(self) -> Dict:
        results = []
        
        # Get base data
        data = self.data_fetcher.get_historical_data(
            self.config['symbol'],
            self.config['start_date'],
            self.config['end_date']
        )
        
        for _ in range(self.n_simulations):
            # Generate synthetic price data
            synthetic_data = self.generate_synthetic_data(data)
            
            # Run backtest with synthetic data
            backtester = Backtester(self.config)
            sim_result = backtester.run()
            results.append(sim_result)
        
        return self.analyze_simulations(results)
    
    def generate_synthetic_data(self, data: pd.DataFrame) -> pd.DataFrame:
        # Calculate daily returns
        returns = np.log(data['Close'] / data['Close'].shift(1))
        
        # Generate random returns using bootstrap
        synthetic_returns = returns.sample(n=len(returns), replace=True)
        
        # Calculate synthetic prices
        synthetic_prices = data['Close'].iloc[0] * np.exp(synthetic_returns.cumsum())
        
        # Create synthetic DataFrame
        synthetic_data = data.copy()
        synthetic_data['Close'] = synthetic_prices
        
        return synthetic_data
    
    def analyze_simulations(self, results: List[Dict]) -> Dict:
        returns = [result['statistics']['total_return'] for result in results]
        drawdowns = [result['statistics']['max_drawdown'] for result in results]
        
        return {
            'mean_return': np.mean(returns),
            'std_return': np.std(returns),
            'worst_return': np.min(returns),
            'best_return': np.max(returns),
            'mean_drawdown': np.mean(drawdowns),
            'worst_drawdown': np.min(drawdowns),
            'confidence_intervals': {
                '95': np.percentile(returns, [2.5, 97.5]),
                '99': np.percentile(returns, [0.5, 99.5])
            },
            'histogram_data': np.histogram(returns, bins=50)
        } 