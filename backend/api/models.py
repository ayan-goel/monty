from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Union

class IndicatorSettings(BaseModel):
    enabled: bool
    period: int
    type: str
    deviation: Optional[float] = None
    crossDirection: Optional[str] = None
    threshold: Optional[int] = None
    condition: Optional[str] = None
    stdDev: Optional[float] = None

    def dict(self, *args, **kwargs):
        # Convert to dictionary and ensure all fields are included
        d = super().dict(*args, **kwargs)
        return {k: v for k, v in d.items() if v is not None}

class StrategyConfig(BaseModel):
    symbol: str
    start_date: str
    end_date: str
    indicators: Dict[str, IndicatorSettings]
    position_size: float = Field(gt=0, le=100)
    take_profit: float = Field(gt=0)
    stop_loss: float = Field(gt=0)
    
    class Config:
        arbitrary_types_allowed = True

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