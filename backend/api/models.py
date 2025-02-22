from pydantic import BaseModel
from typing import List, Optional, Dict

class StrategyConfig(BaseModel):
    symbol: str
    start_date: str
    end_date: str
    indicators: Dict[str, dict]
    position_size: float
    take_profit: float
    stop_loss: float
    
class BacktestResult(BaseModel):
    returns: List[float]
    dates: List[str]
    trades: List[dict]
    statistics: Dict[str, float]
    suggestions: Optional[List[str]] = []

class Trade(BaseModel):
    entry_date: str
    exit_date: Optional[str]
    entry_price: float
    exit_price: Optional[float]
    position_size: float
    profit: Optional[float]
    status: str  # 'open' or 'closed' 