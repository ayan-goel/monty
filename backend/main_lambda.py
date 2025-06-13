import os
from fastapi import FastAPI, HTTPException
import yfinance as yf
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from fastapi.middleware.cors import CORSMiddleware
from core.monte_carlo import MonteCarloSimulator
from core.helpers.backtest_service import BacktestRequest
import google.generativeai as genai

# Initialize FastAPI app
app = FastAPI(
    title="Monty Lambda",
    description="An integration of backtesting, forward testing, and AI portfolio management on AWS Lambda.",
    version="1.0.0"
)

# Configure CORS for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-domain.com",  # Replace with your actual frontend domain
        "http://localhost:3000",  # For development
        "*"  # Remove this in production for security
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Configure Google AI if API key is available
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

# Environment variables are loaded from serverless.yml

class MonteCarloRequest(BaseModel):
    lookback_years: int = 10
    simulation_length_days: int = 252
    num_simulations: int = 500
    backtest_request: BacktestRequest

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
    def __init__(self, entry_price: float, entry_date: datetime, size: float, 
                 initial_value: float, direction: TradeDirection):
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

class BacktestService:
    def __init__(self, debug=True):
        self.debug = debug
    
    def get_historical_data(self, symbol: str, start_date: str, end_date: str, timeframe="1d") -> pd.DataFrame:
        ticker = yf.Ticker(symbol)
        df = ticker.history(start=start_date, end=end_date, interval=timeframe)
        if self.debug:
            print(f"\nFetched {len(df)} data points for {symbol}")
        return df

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
    
    def calculate_macd(self,df, short_period=12, long_period=26):
        short_ema = df['Close'].ewm(span=short_period, adjust=False).mean() # calculate the exponental weighted movement to short
        long_ema = df['Close'].ewm(span=long_period, adjust=False).mean() # calculate the exponential weighted movement for long
        return short_ema - long_ema # subtract them
    
    def calculate_signal_line(self,df, macd_column='MACD', signal_period=9): # need the signal line to predict divergence
        return df[macd_column].ewm(span=signal_period, adjust=False).mean()

    def calculate_macd_divergence(self,df, divergence_type='BULLISH'):
        price_trend = df['Close'].diff()
        macd_trend = df['MACD'].diff()
        if divergence_type == 'BULLISH':
            return (price_trend < 0) & (macd_trend > 0)
        elif divergence_type == 'BEARISH':
            return (price_trend > 0) & (macd_trend < 0)
        return None
    
    def calculate_adx(self, data: pd.DataFrame, period: int) -> pd.Series:
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

        data['+DI'] = (data['+DM'].rolling(window=period).mean() / data['TR'].rolling(window=period).mean()) * 100
        data['-DI'] = (data['-DM'].rolling(window=period).mean() / data['TR'].rolling(window=period).mean()) * 100
        
        data['DX'] = (abs(data['+DI'] - data['-DI']) / (data['+DI'] + data['-DI'])) * 100
        adx = data['DX'].rolling(window=period).mean()
        
        return adx

    def calculate_bollinger_bands(self, data: pd.DataFrame, period: int, std_dev: float) -> pd.DataFrame:
        sma = data['Close'].rolling(window=period).mean()
        std = data['Close'].rolling(window=period).std()
        
        bb_data = pd.DataFrame()
        bb_data['BB_Middle'] = sma
        bb_data['BB_Upper'] = sma + (std * std_dev)
        bb_data['BB_Lower'] = sma - (std * std_dev)
        bb_data['BB_Width'] = bb_data['BB_Upper'] - bb_data['BB_Lower']
        bb_data['BB_Position'] = (data['Close'] - bb_data['BB_Lower']) / bb_data['BB_Width']
        
        return bb_data

    def calculate_indicators(self, df: pd.DataFrame, entry_conditions: EntryCondition) -> pd.DataFrame:
        if entry_conditions.ma_condition:
            ma_cond = entry_conditions.ma_condition
            period = ma_cond.period
            
            if ma_cond.ma_type == MAType.SMA:
                df[f'MA_{period}'] = self.calculate_sma(df, period)
            else:
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

            if entry_conditions.macd_condition and entry_conditions.macd_condition.crossover:
                if entry_conditions.macd_condition.crossover == "BULLISH":
                    df['MACD_Crossover'] = (df['MACD'].shift(1) < df['Signal_Line'].shift(1)) & (df['MACD'] > df['Signal_Line'])
                elif entry_conditions.macd_condition.crossover == "BEARISH":
                    df['MACD_Crossover'] = (df['MACD'].shift(1) > df['Signal_Line'].shift(1)) & (df['MACD'] < df['Signal_Line'])

            if hasattr(entry_conditions.macd_condition, 'histogram_positive'):
                df['MACD_Histogram_Positive'] = df['MACD_Histogram'] > 0

            if entry_conditions.macd_condition and entry_conditions.macd_condition.macd_comparison == MACDComparisonType.ABOVE_ZERO:
                df['MACD_Above_Zero'] = df['MACD'] > 0
        
        if entry_conditions.bb_condition:
            bb_cond = entry_conditions.bb_condition
            bb_df = self.calculate_bollinger_bands(df, bb_cond.period, bb_cond.std_dev)
            for col in bb_df.columns:
                df[col] = bb_df[col]

        if entry_conditions.adx_condition:
            adx_cond = entry_conditions.adx_condition
            adx_data = self.calculate_adx(df, adx_cond.period)
            df['ADX'] = adx_data

        return df

    def check_entry_conditions(self, row: pd.Series, prev_row: pd.Series, entry_conditions: EntryCondition) -> Optional[TradeDirection]:
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

            macd_condition_met = all(conditions_met) if conditions_met else True
        
        if entry_conditions.bb_condition:
            bb_cond = entry_conditions.bb_condition
            
            if bb_cond.comparison == BBComparisonType.ABOVE_UPPER:
                bb_condition_met = row['Close'] > row['BB_Upper']
            elif bb_cond.comparison == BBComparisonType.BELOW_LOWER:
                bb_condition_met = row['Close'] < row['BB_Lower']
            elif bb_cond.comparison == BBComparisonType.CROSS_MIDDLE_UP:
                bb_condition_met = (prev_row['Close'] <= prev_row['BB_Middle'] and row['Close'] > row['BB_Middle'])
            elif bb_cond.comparison == BBComparisonType.CROSS_MIDDLE_DOWN:
                bb_condition_met = (prev_row['Close'] >= prev_row['BB_Middle'] and row['Close'] < row['BB_Middle'])

        if entry_conditions.adx_condition:
            adx_cond = entry_conditions.adx_condition
            
            if adx_cond.comparison == ADXComparisonType.ABOVE:
                adx_condition_met = row['ADX'] > adx_cond.value
            elif adx_cond.comparison == ADXComparisonType.BELOW:
                adx_condition_met = row['ADX'] < adx_cond.value

        if ((entry_conditions.ma_condition is None or ma_condition_met) and 
            (entry_conditions.rsi_condition is None or rsi_condition_met) and
            (entry_conditions.macd_condition is None or macd_condition_met) and
            (entry_conditions.bb_condition is None or bb_condition_met) and
            (entry_conditions.adx_condition is None or adx_condition_met)):
            return entry_conditions.trade_direction
        
        return None

    def run_backtest(self, request: BacktestRequest) -> Dict[str, Any]:
        df = self.get_historical_data(request.symbol, request.start_date, request.end_date, request.timeframe)
        df = self.calculate_indicators(df, request.entry_conditions)
        
        open_positions = []
        trades = []
        equity_curve = [request.initial_capital]
        cash = request.initial_capital
        current_capital = request.initial_capital
        
        for i in range(1, len(df)):
            current_row = df.iloc[i]
            prev_row = df.iloc[i-1]
            
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
                else:
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
                    
                    open_positions.remove(position)
            
            trade_direction = self.check_entry_conditions(current_row, prev_row, request.entry_conditions)
            
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
            
            equity_curve.append(current_capital)
        
        if trades:
            winning_trades = [t for t in trades if t['pnl'] > 0]
            total_trades = len(trades)
            
            return {
                'success': True,
                'total_trades': total_trades,
                'winning_trades': len(winning_trades),
                'losing_trades': total_trades - len(winning_trades),
                'win_rate': (len(winning_trades) / total_trades) * 100 if total_trades > 0 else 0,
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
                'success': True,
                'message': 'No trades were executed based on the given conditions',
                'total_trades': 0,
                'initial_capital': request.initial_capital,
                'final_capital': current_capital,
                'equity_curve': equity_curve
            }

    def _calculate_max_drawdown(self, equity_curve: List[float]) -> float:
        if not equity_curve:
            return 0.0
            
        peak = float('-inf')
        max_drawdown = 0.0
        
        for equity in equity_curve:
            if equity > peak:
                peak = equity
            if peak > 0:  
                drawdown = (peak - equity) / peak * 100
                max_drawdown = max(max_drawdown, drawdown)
                
        return max_drawdown

# Initialize the backtest service
backtest_service = BacktestService(debug=False)  # Disable debug for Lambda

@app.get("/")
async def root():
    return {
        "message": "Monty API running on AWS Lambda",
        "version": "1.0.0",
        "environment": "production"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "environment": "lambda"}

@app.post("/backtest", response_model=Dict[str, Any])
async def run_backtest(request: BacktestRequest):
    try:
        result = backtest_service.run_backtest(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/montecarlo", response_model=Dict[str, Any])
async def run_monte_carlo(request: MonteCarloRequest):
    try:
        simulator = MonteCarloSimulator(
            lookback_years=request.lookback_years,
            simulation_length_days=request.simulation_length_days
        )
        result = simulator.run_simulations(
            backtest_request=request.backtest_request,
            num_simulations=request.num_simulations
        )
        return result.__dict__
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/monte-carlo", response_model=Dict[str, Any])
async def run_monte_carlo_alt(request: Dict[str, Any]):
    try:
        # Extract parameters from request
        lookback_years = request.get('lookback_years', 10)
        simulation_length_days = request.get('simulation_length_days', 252)
        num_simulations = request.get('num_simulations', 500)
        backtest_request_data = request.get('backtest_request', {})
        
        # Create BacktestRequest object
        backtest_request = BacktestRequest(
            symbol=backtest_request_data['symbol'],
            start_date=backtest_request_data.get('start_date', '2024-01-01'),
            end_date=backtest_request_data.get('end_date', '2024-12-31'),
            timeframe=backtest_request_data.get('timeframe', '1d'),
            initial_capital=backtest_request_data.get('initial_capital', 10000),
            entry_conditions=backtest_request_data.get('entry_conditions', {}),
            exit_conditions=backtest_request_data.get('exit_conditions', {})
        )
        
        simulator = MonteCarloSimulator(
            lookback_years=lookback_years,
            simulation_length_days=simulation_length_days
        )
        result = simulator.run_simulations(
            backtest_request=backtest_request,
            num_simulations=num_simulations
        )
        return result.__dict__
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/debug-request")
async def debug_request(request: Dict[str, Any]):
    return {
        "message": "Debug endpoint",
        "received_data": request,
        "timestamp": datetime.now().isoformat(),
        "environment": "lambda"
    }

@app.post("/monte-carlo-analysis")
async def analyze_monte_carlo_results(request: Dict[str, Any]):
    try:
        results = request.get('results')
        strategy = request.get('strategy')
        
        # Validate that required data is present
        if not results:
            raise HTTPException(status_code=400, detail="Missing 'results' in request")
        if not strategy:
            raise HTTPException(status_code=400, detail="Missing 'strategy' in request")
        if not isinstance(results, dict):
            raise HTTPException(status_code=400, detail="'results' must be a dictionary")
        if not isinstance(strategy, dict):
            raise HTTPException(status_code=400, detail="'strategy' must be a dictionary")
        
        # Check for required result fields
        required_result_fields = ['avg_return', 'median_return', 'win_rate', 'avg_drawdown', 'worst_drawdown', 'sharpe_ratio']
        for field in required_result_fields:
            if field not in results:
                raise HTTPException(status_code=400, detail=f"Missing '{field}' in results")
        
        # Check for required strategy fields
        if 'exit_conditions' not in strategy:
            raise HTTPException(status_code=400, detail="Missing 'exit_conditions' in strategy")
        if 'entry_conditions' not in strategy:
            raise HTTPException(status_code=400, detail="Missing 'entry_conditions' in strategy")
        
        exit_conditions = strategy['exit_conditions']
        if not isinstance(exit_conditions, dict):
            raise HTTPException(status_code=400, detail="'exit_conditions' must be a dictionary")
        
        required_exit_fields = ['stop_loss_pct', 'take_profit_pct', 'position_size_pct']
        for field in required_exit_fields:
            if field not in exit_conditions:
                raise HTTPException(status_code=400, detail=f"Missing '{field}' in exit_conditions")
        
        # Configure the model with more precise settings for JSON output
        generation_config = {
            'temperature': 0.1,  # Lower temperature for more consistent output
            'top_p': 0.8,
            'top_k': 40,
            'max_output_tokens': 2048,
        }
        
        model = genai.GenerativeModel(
            'gemini-2.0-flash',
            generation_config=generation_config
        )
        
        # Extract position size safely
        position_size = strategy['exit_conditions']['position_size_pct']
        
        prompt = f"""You are a professional trading strategy analyst. Analyze the provided Monte Carlo simulation results and return your analysis as a valid JSON object.

CRITICAL: You must return ONLY a valid JSON object with no additional text, markdown formatting, or explanations.

Required JSON Structure:
{{
  "overall_assessment": {{
    "rating": "Excellent|Good|Fair|Poor",
    "summary": "3-4 sentence assessment of strategy performance and viability"
  }},
  "key_insights": [
    "Analysis of return patterns and distribution",
    "Win rate and consistency analysis", 
    "Drawdown patterns and risk exposure examination",
    "Risk-adjusted returns and Sharpe ratio analysis",
    "Strategy robustness across market conditions"
  ],
  "risk_management": {{
    "current_assessment": "Assessment of current risk levels and drawdown patterns",
    "recommendations": [
      "Specific risk management recommendation with exact parameters",
      "Alternative risk approach with clear reasoning",
      "Advanced risk technique with implementation steps",
      "Portfolio-level risk suggestion with targets"
    ]
  }},
  "strategy_optimization": {{
    "strengths": [
      "Strength with supporting data and reasoning",
      "Another strength with quantitative evidence",
      "Additional strength with performance metrics"
    ],
    "weaknesses": [
      "Weakness with data analysis and impact", 
      "Another weakness with root cause analysis",
      "Additional weakness with performance details"
    ],
    "improvements": [
      "Improvement with parameter adjustments and impact",
      "Alternative indicator suggestion with settings",
      "Entry timing optimization with techniques",
      "Exit strategy enhancement with methods"
    ]
  }},
  "position_sizing": {{
    "current_analysis": "Analysis of the current {position_size}% position size and its implications",
    "recommendation": "Position sizing recommendation with specific ranges and methods"
  }}
}}

Performance Data:
- Average Return: {results['avg_return']:.2f}%
- Median Return: {results['median_return']:.2f}%
- Win Rate: {results['win_rate']:.2f}%
- Average Drawdown: {results['avg_drawdown']:.2f}%
- Worst Drawdown: {results['worst_drawdown']:.2f}%
- Sharpe Ratio: {results['sharpe_ratio']:.2f}

Strategy Settings:
- Entry Conditions: {strategy['entry_conditions']}
- Stop Loss: {strategy['exit_conditions']['stop_loss_pct']}%
- Take Profit: {strategy['exit_conditions']['take_profit_pct']}%
- Position Size: {position_size}%

IMPORTANT: Return only the JSON object. Do not include any text before or after the JSON."""

        response = model.generate_content(prompt)

        try:
            import json
            import re
            
            # Clean the response text
            response_text = response.text.strip()
            
            # Multiple strategies to extract valid JSON
            json_text = None
            
            # Strategy 1: Try the response as-is
            if response_text.startswith('{') and response_text.endswith('}'):
                json_text = response_text
            
            # Strategy 2: Extract JSON from markdown code blocks
            if not json_text:
                markdown_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
                if markdown_match:
                    json_text = markdown_match.group(1)
            
            # Strategy 3: Find the first complete JSON object
            if not json_text:
                # More precise regex to find balanced braces
                brace_count = 0
                start_idx = response_text.find('{')
                if start_idx != -1:
                    for i, char in enumerate(response_text[start_idx:], start_idx):
                        if char == '{':
                            brace_count += 1
                        elif char == '}':
                            brace_count -= 1
                            if brace_count == 0:
                                json_text = response_text[start_idx:i+1]
                                break
            
            # Strategy 4: Last resort - use the original regex
            if not json_text:
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    json_text = json_match.group(0)
            
            if not json_text:
                raise ValueError("No JSON object found in response")
            
            analysis_json = json.loads(json_text)
            
            # Validate the structure
            required_keys = ['overall_assessment', 'key_insights', 'risk_management', 'strategy_optimization', 'position_sizing']
            for key in required_keys:
                if key not in analysis_json:
                    raise ValueError(f"Missing required key: {key}")
            
            return {
                'analysis': analysis_json,
                'is_structured': True
            }
            
        except (json.JSONDecodeError, ValueError) as e:
            # Try to make a second request with an even more explicit prompt
            try:
                simple_prompt = f"""Return a valid JSON analysis of these trading results. Use this exact format:

{{"overall_assessment":{{"rating":"Fair","summary":"Strategy shows mixed results with room for improvement"}},"key_insights":["Return analysis","Win rate analysis","Risk analysis"],"risk_management":{{"current_assessment":"Risk assessment","recommendations":["Risk recommendation"]}},"strategy_optimization":{{"strengths":["Strategy strength"],"weaknesses":["Strategy weakness"],"improvements":["Strategy improvement"]}},"position_sizing":{{"current_analysis":"Position analysis","recommendation":"Position recommendation"}}}}

Data: Returns {results['avg_return']:.1f}%, Win Rate {results['win_rate']:.1f}%, Drawdown {results['worst_drawdown']:.1f}%, Sharpe {results['sharpe_ratio']:.2f}

Return only valid JSON:"""
                
                second_response = model.generate_content(simple_prompt)
                simple_json = json.loads(second_response.text.strip())
                
                return {
                    'analysis': simple_json,
                    'is_structured': True
                }
            except:
                # Final fallback - return a default structured response
                return {
                    'analysis': {
                        'overall_assessment': {
                            'rating': 'Fair',
                            'summary': f'The strategy shows an average return of {results["avg_return"]:.2f}% with a win rate of {results["win_rate"]:.2f}% and a worst drawdown of {results["worst_drawdown"]:.2f}%. Analysis requires further review.'
                        },
                        'key_insights': [
                            f'Average return of {results["avg_return"]:.2f}% indicates moderate performance',
                            f'Win rate of {results["win_rate"]:.2f}% shows consistency needs improvement',
                            f'Worst drawdown of {results["worst_drawdown"]:.2f}% indicates significant risk exposure'
                        ],
                        'risk_management': {
                            'current_assessment': f'Current risk levels show average drawdown of {results["avg_drawdown"]:.2f}% with maximum exposure of {results["worst_drawdown"]:.2f}%',
                            'recommendations': [
                                'Consider implementing trailing stop losses',
                                'Reduce position size during high volatility periods',
                                'Implement proper risk-reward ratios'
                            ]
                        },
                        'strategy_optimization': {
                            'strengths': ['Strategy shows measurable returns'],
                            'weaknesses': ['High drawdown exposure', 'Inconsistent win rate'],
                            'improvements': ['Optimize entry/exit timing', 'Improve risk management']
                        },
                        'position_sizing': {
                            'current_analysis': f'Current position size of {position_size}% may need adjustment based on risk metrics',
                            'recommendation': 'Consider dynamic position sizing based on volatility'
                        }
                    },
                    'is_structured': True
                }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 