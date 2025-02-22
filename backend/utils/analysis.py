from typing import Dict
import numpy as np

class StrategyAnalyzer:
    def analyze_results(self, results: Dict) -> Dict:
        analysis = {}
        
        # Calculate basic metrics
        analysis['metrics'] = self.calculate_metrics(results)
        
        # Generate suggestions
        analysis['suggestions'] = self.generate_suggestions(results)
        
        return analysis
    
    def calculate_metrics(self, results: Dict) -> Dict:
        returns = np.array(results['returns'])
        
        metrics = {
            'total_return': (returns[-1] - returns[0]) / returns[0] * 100,
            'volatility': np.std(returns) * np.sqrt(252),
            'sharpe_ratio': self.calculate_sharpe_ratio(returns),
            'max_drawdown': self.calculate_max_drawdown(returns),
            'win_rate': results.get('statistics', {}).get('win_rate', 0)
        }
        
        return metrics
    
    @staticmethod
    def calculate_sharpe_ratio(returns: np.array, risk_free_rate: float = 0.02) -> float:
        returns_pct = (returns[1:] - returns[:-1]) / returns[:-1]
        excess_returns = returns_pct - risk_free_rate/252
        if len(excess_returns) == 0 or np.std(excess_returns) == 0:
            return 0
        return np.mean(excess_returns) / np.std(excess_returns) * np.sqrt(252)
    
    @staticmethod
    def calculate_max_drawdown(returns: np.array) -> float:
        peak = returns[0]
        max_drawdown = 0
        
        for value in returns:
            if value > peak:
                peak = value
            drawdown = (peak - value) / peak
            max_drawdown = max(max_drawdown, drawdown)
            
        return max_drawdown * 100
    
    def generate_suggestions(self, results: Dict) -> list:
        metrics = self.calculate_metrics(results)
        suggestions = []
        
        # Position sizing suggestions
        if metrics['max_drawdown'] > 20:
            suggestions.append("Consider reducing position size to limit maximum drawdown")
        
        # Risk/Reward suggestions
        if metrics['win_rate'] < 40:
            suggestions.append("Consider adjusting take-profit levels to improve win rate")
        
        # Volatility suggestions
        if metrics['volatility'] > 30:
            suggestions.append("Strategy shows high volatility. Consider adding filters or increasing timeframe")
        
        return suggestions 