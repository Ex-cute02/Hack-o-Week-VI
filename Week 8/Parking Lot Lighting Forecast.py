import pandas as pd
import numpy as np
import streamlit as st
import plotly.express as px
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression

st.title("Parking Lot Lighting Forecast")

DATA_PATH = r"D:\SIT\SEM 6\Hack-O-Week\Feb\Week4\SPSIRDATA.csv"

@st.cache_data
def load_data():
    df = pd.read_csv(DATA_PATH)

    # Convert timestamp
    df["created_at"] = pd.to_datetime(df["created_at"])

    # Extract number from IR sensor (IR20 → 20)
    df["vehicle_count"] = df["field1"].str.extract("(\d+)").astype(int)

    # Create lighting usage proxy
    df["light_kwh"] = df["vehicle_count"] * 0.15 + df["field2"] * 2

    return df

df = load_data()

# Polynomial regression
X = df[["vehicle_count"]]
y = df["light_kwh"]

poly = PolynomialFeatures(degree=2)
X_poly = poly.fit_transform(X)

model = LinearRegression()
model.fit(X_poly, y)

# Predict
df["pred_light"] = model.predict(X_poly)

# Detect anomalies
df["error"] = abs(df["light_kwh"] - df["pred_light"])
threshold = df["error"].mean() + df["error"].std()
df["anomaly"] = df["error"] > threshold

# Bar chart
fig = px.bar(
    df,
    x="created_at",
    y="pred_light",
    color="anomaly",
    title="Parking Lighting Forecast with Anomaly Detection"
)

st.plotly_chart(fig, use_container_width=True)

st.subheader("Anomalies")
st.write(df[df["anomaly"]])