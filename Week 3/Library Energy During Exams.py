import pandas as pd
import streamlit as st
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import plotly.graph_objects as go

st.title("Library Energy During Exams")

FILE_PATH = "D:\Hack-O-Week\Jan\Week 3\Dataset_v2.xlsx"

@st.cache_data
def load_data():
    df = pd.read_excel(FILE_PATH, sheet_name="Weather")

    # Clean column names
    df.columns = df.columns.str.strip()

    # Convert Date to datetime and set index
    df["Date"] = pd.to_datetime(df["Date"])
    df.set_index("Date", inplace=True)

    # Rename the exact column present in your file
    df.rename(columns={"Outdoor temperature (ºC)": "temp"}, inplace=True)

    return df

df = load_data()

# Create daily average series
daily_temp = df["temp"].resample("D").mean()

# Exponential Smoothing model
model = ExponentialSmoothing(daily_temp, trend="add", seasonal=None)
model_fit = model.fit()

# Forecast next 7 days
forecast = model_fit.forecast(7)
predicted_value = forecast.mean()

# Gauge visualization
fig = go.Figure(go.Indicator(
    mode="gauge+number",
    value=float(predicted_value),
    title={"text": "Predicted Semester-End Library Energy Level"},
    gauge={
        "axis": {"range": [float(daily_temp.min()), float(daily_temp.max()*1.5)]},
        "steps": [
            {"range": [float(daily_temp.min()), float(daily_temp.quantile(0.4))]},
            {"range": [float(daily_temp.quantile(0.4)), float(daily_temp.quantile(0.7))]},
            {"range": [float(daily_temp.quantile(0.7)), float(daily_temp.max()*1.5)]}
        ]
    }
))

st.plotly_chart(fig, use_container_width=True)

st.subheader("Forecast Summary")
st.write("Predicted Level:", round(float(predicted_value), 2))
