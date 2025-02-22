from pydantic import BaseSettings

class Settings(BaseSettings):
    POLYGON_API_KEY: str
    MONTE_CARLO_SIMULATIONS: int = 1000
    
    class Config:
        env_file = ".env"

settings = Settings() 