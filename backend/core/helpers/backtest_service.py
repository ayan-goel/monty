import pandas as pd
from enum import Enum
from typing import Optional, Literal, List, Any, Dict
import yfinance as yf
from pydantic import BaseModel
import numpy as np

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

class MACondition(BaseModel):
    period: int = 20
    ma_type: MAType
    comparison: MAComparisonType
    deviation_pct: float

class RSICondition(BaseModel):
    period: int = 14
    comparison: Literal["ABOVE", "BELOW"]
    value: float

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

class BBComparisonType(str, Enum):
    ABOVE_UPPER = "ABOVE_UPPER"
    BELOW_LOWER = "BELOW_LOWER"
    CROSS_MIDDLE_UP = "CROSS_MIDDLE_UP"
    CROSS_MIDDLE_DOWN = "CROSS_MIDDLE_DOWN"

class ADXComparisonType(str, Enum):
    ABOVE = "ABOVE"
    BELOW = "BELOW"
    DI_CROSS_ABOVE = "DI_CROSS_ABOVE"
    DI_CROSS_BELOW = "DI_CROSS_BELOW"

class BBCondition(BaseModel):
    period: int = 20
    std_dev: float = 2.0
    comparison: BBComparisonType

class ADXCondition(BaseModel):
    period: int = 14
    comparison: ADXComparisonType
    value: float = 25.0

class EntryCondition(BaseModel):
    ma_condition: Optional[MACondition] = None
    rsi_condition: Optional[RSICondition] = None
    macd_condition: Optional[MACDCondition] = None
    bb_condition: Optional[BBCondition] = None
    adx_condition: Optional[ADXCondition] = None
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

class Position:
    def __init__(self, entry_price: float, entry_date: pd.Timestamp, 
                 size: float, initial_value: float, direction: TradeDirection):
        self.entry_price = entry_price
        self.entry_date = entry_date
        self.size = size
        self.initial_value = initial_value
        self.direction = direction

    def calculate_pnl(self, current_price: float) -> tuple[float, float]:
        if self.direction == TradeDirection.BUY:
            pnl = (current_price - self.entry_price) * self.size
        else:
            pnl = (self.entry_price - current_price) * self.size

        pnl_pct = (pnl / self.initial_value) * 100 if self.initial_value != 0 else 0
        return pnl, pnl_pct

class MonteCarloBacktestService:    
    def __init__(self, debug=False):
        self.debug = debug

    def check_entry_conditions(self, row: pd.Series, prev_row: pd.Series, 
                             entry_conditions: EntryCondition) -> Optional[TradeDirection]:
        ma_condition_met = False
        rsi_condition_met = False
        macd_condition_met = False
        bb_condition_met = False
        adx_condition_met = False
        
        if entry_conditions.ma_condition:
            ma_cond = entry_conditions.ma_condition
            period = ma_cond.period
            ma_col = f'MA_{period}'
            
            if ma_cond.comparison == MAComparisonType.CROSS_ABOVE:
                ma_condition_met = (prev_row['Close'] <= prev_row[f'{ma_col}_upper'] and 
                                   row['Close'] > row[f'{ma_col}_upper'])
            elif ma_cond.comparison == MAComparisonType.CROSS_BELOW:
                ma_condition_met = (prev_row['Close'] >= prev_row[f'{ma_col}_lower'] and 
                                   row['Close'] < row[f'{ma_col}_lower'])
            elif ma_cond.comparison == MAComparisonType.ABOVE:
                ma_condition_met = row['Close'] > row[f'{ma_col}_upper']
            elif ma_cond.comparison == MAComparisonType.BELOW:
                ma_condition_met = row['Close'] < row[f'{ma_col}_lower']

        if entry_conditions.rsi_condition:
            rsi_cond = entry_conditions.rsi_condition
            rsi_col = f'RSI_{rsi_cond.period}'
            
            if rsi_cond.comparison == "ABOVE":
                rsi_condition_met = row[rsi_col] > rsi_cond.value
            else:
                rsi_condition_met = row[rsi_col] < rsi_cond.value

        if entry_conditions.macd_condition:
            macd_cond = entry_conditions.macd_condition
            conditions_met = []

            if macd_cond.crossover:
                if macd_cond.crossover == MACDCrossoverType.BULLISH:
                    conditions_met.append(row['MACD_Crossover'])
                elif macd_cond.crossover == MACDCrossoverType.BEARISH:
                    conditions_met.append(row['MACD_Crossover'])

            if macd_cond.histogram_positive is not None:
                conditions_met.append(row['MACD_Histogram_Positive'] == macd_cond.histogram_positive)

            if macd_cond.macd_comparison:
                if macd_cond.macd_comparison == MACDComparisonType.ABOVE_ZERO:
                    conditions_met.append(row['MACD'] > 0)
                elif macd_cond.macd_comparison == MACDComparisonType.BELOW_ZERO:
                    conditions_met.append(row['MACD'] < 0)

            if macd_cond.macd_signal_deviation_pct:
                conditions_met.append(row['MACD_Signal_Deviation'])

            macd_condition_met = all(conditions_met) if conditions_met else True
        
        if entry_conditions.bb_condition:
            bb_cond = entry_conditions.bb_condition
            
            if bb_cond.comparison == BBComparisonType.ABOVE_UPPER:
                bb_condition_met = row['Close'] > row['BB_upper']
            elif bb_cond.comparison == BBComparisonType.BELOW_LOWER:
                bb_condition_met = row['Close'] < row['BB_lower']
            elif bb_cond.comparison == BBComparisonType.CROSS_MIDDLE_UP:
                bb_condition_met = (prev_row['Close'] <= prev_row['BB_middle'] and 
                                  row['Close'] > row['BB_middle'])
            elif bb_cond.comparison == BBComparisonType.CROSS_MIDDLE_DOWN:
                bb_condition_met = (prev_row['Close'] >= prev_row['BB_middle'] and 
                                  row['Close'] < row['BB_middle'])

        if entry_conditions.adx_condition:
            adx_cond = entry_conditions.adx_condition
            
            if adx_cond.comparison == ADXComparisonType.ABOVE:
                adx_condition_met = row['ADX'] > adx_cond.value
            elif adx_cond.comparison == ADXComparisonType.BELOW:
                adx_condition_met = row['ADX'] < adx_cond.value
            elif adx_cond.comparison == ADXComparisonType.DI_CROSS_ABOVE:
                adx_condition_met = (prev_row['+DI14'] <= prev_row['-DI14'] and 
                                   row['+DI14'] > row['-DI14'])
            elif adx_cond.comparison == ADXComparisonType.DI_CROSS_BELOW:
                adx_condition_met = (prev_row['+DI14'] >= prev_row['-DI14'] and 
                                   row['+DI14'] < row['-DI14'])

        if ((entry_conditions.ma_condition is None or ma_condition_met) and 
            (entry_conditions.rsi_condition is None or rsi_condition_met) and
            (entry_conditions.macd_condition is None or macd_condition_met) and
            (entry_conditions.bb_condition is None or bb_condition_met) and
            (entry_conditions.adx_condition is None or adx_condition_met)):
            return entry_conditions.trade_direction
        
        return None

    def run_backtest_on_simulated_data(self, 
                                      simulated_data: pd.DataFrame, 
                                      request: BacktestRequest) -> Dict[str, Any]:
        try:
            open_positions = []
            trades = []
            equity_curve = [request.initial_capital]
            cash = request.initial_capital
            current_capital = request.initial_capital
            
            if len(simulated_data) < 2:
                raise ValueError("Insufficient data points for backtest")
            
            for i in range(1, len(simulated_data)):
                current_row = simulated_data.iloc[i]
                prev_row = simulated_data.iloc[i-1]
                
                # Calculate total position value
                total_position_value = sum(
                    position.initial_value + position.calculate_pnl(current_row['Close'])[0] 
                    for position in open_positions
                )
                
                current_capital = cash + total_position_value
                
                for position in open_positions[:]:
                    pnl, pnl_pct = position.calculate_pnl(current_row['Close'])
                    
                    should_exit = False
                    exit_reason = None
                    
                    if position.direction == TradeDirection.BUY:
                        if pnl_pct <= -request.exit_conditions.stop_loss_pct:
                            should_exit = True
                            exit_reason = "Stop Loss"
                        elif pnl_pct >= request.exit_conditions.take_profit_pct:
                            should_exit = True
                            exit_reason = "Take Profit"
                    else:  # SELL
                        if pnl_pct <= -request.exit_conditions.stop_loss_pct:
                            should_exit = True
                            exit_reason = "Stop Loss"
                        elif pnl_pct >= request.exit_conditions.take_profit_pct:
                            should_exit = True
                            exit_reason = "Take Profit"
                    
                    if should_exit:
                        cash += position.initial_value + pnl
                        
                        trades.append({
                            'entry_date': position.entry_date.isoformat(),
                            'exit_date': current_row.name.isoformat(),
                            'direction': position.direction,
                            'entry_price': position.entry_price,
                            'exit_price': current_row['Close'],
                            'pnl': pnl,
                            'pnl_pct': pnl_pct,
                            'exit_reason': exit_reason
                        })
                        
                        if self.debug:
                            print(f"\nExiting {position.direction} trade at {current_row.name}")
                            print(f"Exit Price: ${current_row['Close']:.2f}")
                            print(f"P&L: ${pnl:.2f} ({pnl_pct:.2f}%)")
                            print(f"Reason: {exit_reason}")
                        
                        open_positions.remove(position)
                
                # Check entry conditions
                trade_direction = self.check_entry_conditions(current_row, prev_row, request.entry_conditions)
                
                # Calculate position size based on current capital
                max_position_value = current_capital * request.exit_conditions.position_size_pct / 100
                
                if trade_direction:
                    position_value = max_position_value
                    position_size = position_value / current_row['Close']
                    
                    if position_value <= cash:
                        cash -= position_value
                        new_position = Position(
                            entry_price=current_row['Close'],
                            entry_date=current_row.name,
                            size=position_size,
                            initial_value=position_value,
                            direction=trade_direction
                        )
                        open_positions.append(new_position)
                        
                        if self.debug:
                            print(f"\nEntering {trade_direction} trade at {current_row.name}")
                            print(f"Entry Price: ${current_row['Close']:.2f}")
                            print(f"Position Size: {position_size:.2f} shares")
                            print(f"Position Value: ${position_value:.2f}")
                
                equity_curve.append(current_capital)
            
            if trades:
                winning_trades = [t for t in trades if t['pnl'] > 0]
                total_trades = len(trades)
                
                return {
                    'total_trades': total_trades,
                    'winning_trades': len(winning_trades),
                    'losing_trades': total_trades - len(winning_trades),
                    'win_rate': (len(winning_trades) / total_trades) * 100,
                    'initial_capital': request.initial_capital,
                    'final_capital': current_capital,
                    'total_return_pct': ((current_capital - request.initial_capital) / 
                                    request.initial_capital) * 100,
                    'max_drawdown_pct': self._calculate_max_drawdown(equity_curve),
                    'avg_profit': (sum(t['pnl'] for t in winning_trades) / 
                                len(winning_trades)) if winning_trades else 0,
                    'avg_loss': (sum(t['pnl'] for t in trades if t['pnl'] <= 0) / 
                            (total_trades - len(winning_trades))) 
                            if total_trades > len(winning_trades) else 0,
                    'trades': trades,
                    'equity_curve': equity_curve
                }
            else:
                return {
                    'message': 'No trades executed during the simulation period',
                    'data_points': len(simulated_data),
                    'date_range': f"{simulated_data.index[0]} to {simulated_data.index[-1]}"
                }
                
        except Exception as e:
            raise ValueError(f"Error in Monte Carlo backtest: {str(e)}")

    def _calculate_max_drawdown(self, equity_curve: List[float]) -> float:
        if not equity_curve:
            return 0.0
            
        peak = float('-inf')
        max_drawdown = 0.0
        
        for equity in equity_curve:
            if equity > peak:
                peak = equity
            if peak > 0:  # Ensure we don't divide by zero
                drawdown = (peak - equity) / peak * 100
                max_drawdown = max(max_drawdown, drawdown)
                
        return max_drawdown