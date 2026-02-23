import pandas as pd
from prophet import Prophet
import random
from datetime import datetime, timedelta

def generate_historical_data(days=365):
    """Generates synthetic historical admission data."""
    dates = [datetime.today() - timedelta(days=x) for x in range(days)]
    dates.sort()
    
    data = []
    for d in dates:
        # Base demand
        base = 50
        # Weekly seasonality (high on Mon, low on Sun)
        if d.weekday() == 0: base += 20 # Monday
        elif d.weekday() == 6: base -= 10 # Sunday
        
        # Yearly seasonality (flu season)
        month = d.month
        if month in [12, 1, 2]: base += 15
        
        # Noise
        noise = random.randint(-5, 5)
        
        admissions = max(0, base + noise)
        data.append({'ds': d, 'y': admissions})
        
    return pd.DataFrame(data)

def get_forecast(days=30):
    """
    Trains a Prophet model on synthetic history and predicts future demand.
    Returns: JSON-serializable list of forecast points.
    """
    try:
        df = generate_historical_data()
        
        m = Prophet(daily_seasonality=True, weekly_seasonality=True, yearly_seasonality=False)
        m.fit(df)
        
        future = m.make_future_dataframe(periods=days)
        forecast = m.predict(future)
        
        # Filter for future/recent data only to keep payload small
        recent_forecast = forecast.tail(days + 7) # Last week + future
        
        result = []
        for _, row in recent_forecast.iterrows():
            result.append({
                'date': row['ds'].strftime('%Y-%m-%d'),
                'predicted': round(row['yhat']),
                'lower': round(row['yhat_lower']),
                'upper': round(row['yhat_upper'])
            })
            
        return result
    except Exception as e:
        print(f"Prophet Error: {e}")
        return []
