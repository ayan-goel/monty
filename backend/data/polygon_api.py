from polygon import RESTClient
from datetime import datetime
import pandas as pd
from typing import Optional
from config import settings

class PolygonData:
    def __init__(self):
        self.client = RESTClient(settings.POLYGON_API_KEY)
    
    def get_historical_data(
        self,
        symbol: str,
        start_date: str,
        end_date: str,
        multiplier: int = 1,
        timespan: str = "day"
    ) -> pd.DataFrame:
        try:
            bars = self.client.get_aggs(
                ticker=symbol,
                multiplier=multiplier,
                timespan=timespan,
                from_=start_date,
                to=end_date
            )
            
            df = pd.DataFrame(bars)
            df.columns = ['Open', 'High', 'Low', 'Close', 'Volume', 'VWAP', 'Transactions']
            df.index = pd.to_datetime(df['timestamp'], unit='ms')
            return df
            
        except Exception as e:
            raise Exception(f"Error fetching data from Polygon: {str(e)}")
    
    def get_technical_indicators(self, symbol: str, indicator: str, params: dict):
        # Implement specific indicator calculations using Polygon's API
        pass 