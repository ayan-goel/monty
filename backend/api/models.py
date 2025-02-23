from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Union
from enum import Enum
from typing import Literal

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

class TradeDirection(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class MAType(str, Enum):
    SMA = "SMA"
    EMA = "EMA"

class MAComparisonType(str, Enum):
    CROSS_ABOVE = "CROSS_ABOVE"
    CROSS_BELOW = "CROSS_BELOW"
    ABOVE = "ABOVE"
    BELOW = "BELOW"

class MACDCrossoverType(str, Enum):
    BULLISH = "BULLISH"  # MACD crosses above Signal Line
    BEARISH = "BEARISH"  # MACD crosses below Signal Line

class MACDComparisonType(str, Enum):
    ABOVE_ZERO = "ABOVE_ZERO"  # MACD above zero line
    BELOW_ZERO = "BELOW_ZERO"  # MACD below zero line
    HISTOGRAM_POSITIVE = "HISTOGRAM_POSITIVE"  # Histogram > 0
    HISTOGRAM_NEGATIVE = "HISTOGRAM_NEGATIVE"  # Histogram < 0

class MACDCondition(BaseModel):
    crossover: Optional[MACDCrossoverType] = None  
    macd_comparison: Optional[MACDComparisonType] = None  
    histogram_positive: Optional[bool] = None  
    macd_signal_deviation_pct: Optional[float] = None 

class MACondition(BaseModel):
    period: int = 20
    ma_type: MAType
    comparison: MAComparisonType
    deviation_pct: float

class RSICondition(BaseModel):
    period: int = 14
    comparison: Literal["ABOVE", "BELOW"]
    value: float

class EntryCondition(BaseModel):
    ma_condition: Optional[MACondition] = None
    rsi_condition: Optional[RSICondition] = None
    macd_condition: Optional[MACDCondition] = None
    trade_direction: TradeDirection

class ExitCondition(BaseModel):
    stop_loss_pct: float
    take_profit_pct: float
    position_size_pct: float

class BacktestRequest(BaseModel):
    symbol: str
    start_date: str
    end_date: str
    timeframe: str = "1d"
    initial_capital: float = 10000.0
    entry_conditions: EntryCondition
    exit_conditions: ExitCondition 