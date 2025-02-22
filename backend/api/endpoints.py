from fastapi import APIRouter, HTTPException
from .models import StrategyConfig, BacktestResult
from core.backtest import Backtester
from core.monte_carlo import MonteCarloSimulator
from utils.analysis import StrategyAnalyzer
from data.stock_data import StockDataFetcher

router = APIRouter()

@router.post("/backtest", response_model=BacktestResult)
async def run_backtest(config: StrategyConfig):
    try:
        # Validate symbol first
        data_fetcher = StockDataFetcher()
        if not data_fetcher.validate_symbol(config.symbol):
            raise ValueError(f"Invalid symbol: {config.symbol}")
            
        backtester = Backtester(config)
        results = backtester.run()
        analyzer = StrategyAnalyzer()
        analysis = analyzer.analyze_results(results)
        
        # Ensure all required fields are present
        return BacktestResult(
            returns=results['returns'],
            dates=results['dates'],
            trades=results.get('trades', []),
            statistics=results['statistics'],
            suggestions=analysis.get('suggestions', [])
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/validate-symbol/{symbol}")
async def validate_symbol(symbol: str):
    try:
        data_fetcher = StockDataFetcher()
        is_valid = data_fetcher.validate_symbol(symbol)
        return {"valid": is_valid}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/monte-carlo")
async def run_monte_carlo(config: StrategyConfig):
    simulator = MonteCarloSimulator(config)
    results = simulator.run()
    return results 