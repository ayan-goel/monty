from polygon import RESTClient
from datetime import datetime, timedelta
import pandas as pd
from typing import Optional
import os
from dotenv import load_dotenv

class StockDataFetcher:
    def __init__(self):
        load_dotenv()
        api_key = os.getenv('POLYGON_API_KEY')
        if not api_key:
            raise ValueError("POLYGON_API_KEY not found in .env file")
        self.client = RESTClient(api_key)

    def get_historical_data(
        self,
        symbol: str,
        start_date: str,
        end_date: str,
        interval: Optional[str] = "1d"
    ) -> pd.DataFrame:
        try:
            symbol = symbol.upper().strip()
            print(f"Fetching data for {symbol}")
            
            start = pd.to_datetime(start_date)
            end = pd.to_datetime(end_date)
            
            aggs = []
            response = self.client.stocks_equities_aggregates(
                ticker=symbol,
                multiplier=1,
                timespan="day",
                from_=start.strftime('%Y-%m-%d'),
                to=end.strftime('%Y-%m-%d')
            )
            
            if hasattr(response, 'results'):
                for result in response.results:
                    aggs.append({
                        'Date': pd.to_datetime(result['t'], unit='ms'),
                        'Open': result['o'],
                        'High': result['h'],
                        'Low': result['l'],
                        'Close': result['c'],
                        'Volume': result['v']
                    })
            
            df = pd.DataFrame(aggs)
            if df.empty:
                raise Exception(f"No data found for {symbol}")
            
            df.set_index('Date', inplace=True)
            df.sort_index(inplace=True)
            
            print(f"Successfully fetched data for {symbol}")
            print(f"Data range: {df.index[0]} to {df.index[-1]}")
            print(f"Number of data points: {len(df)}")
            
            return df
            
        except Exception as e:
            error_msg = str(e)
            print(f"Error details: {error_msg}")
            raise Exception(
                f"Failed to fetch data for {symbol}. "
                f"Please verify the symbol and dates. Error: {error_msg}"
            )

    def validate_symbol(self, symbol: str) -> bool:
        """Validate if a symbol exists"""
        try:
            end = datetime.now()
            start = end - timedelta(days=5)
            data = self.get_historical_data(
                symbol=symbol,
                start_date=start.strftime('%Y-%m-%d'),
                end_date=end.strftime('%Y-%m-%d')
            )
            return not data.empty
        except:
            return False 