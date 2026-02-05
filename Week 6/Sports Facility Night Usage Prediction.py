import pandas as pd
import numpy as np
import streamlit as st
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense

st.title("Sports Facility Night Usage Prediction")

DATA_PATH = "D:\Hack-O-Week\Feb\Week2\LD2011_2014.txt"

@st.cache_data
def load_data():
    df = pd.read_csv(DATA_PATH, sep=";", decimal=",")
    df.rename(columns={df.columns[0]: "timestamp"}, inplace=True)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df.set_index("timestamp", inplace=True)
    return df

df = load_data()

# Convert kW (15 min) to kWh
df = df / 4

# Convert to hourly
hourly = df.resample("H").sum()

# Select one meter as sports facility
meter = hourly.columns[0]
data = hourly[[meter]].copy()
data.columns = ["kwh"]

# Extract night hours (7 PM to 2 AM)
data["hour"] = data.index.hour
night_data = data[(data["hour"] >= 19) | (data["hour"] <= 2)]

# Day type filter
night_data["day_type"] = np.where(night_data.index.dayofweek < 5, "Weekday", "Weekend")
day_filter = st.selectbox("Select Day Type", ["Weekday", "Weekend"])
night_data = night_data[night_data["day_type"] == day_filter]

# Scaling
scaler = MinMaxScaler()
scaled = scaler.fit_transform(night_data[["kwh"]])

# Create sequences (past 24 hours)
def create_seq(data, window=24):
    X, y = [], []
    for i in range(len(data) - window):
        X.append(data[i:i+window])
        y.append(data[i+window])
    return np.array(X), np.array(y)

X, y = create_seq(scaled, 24)

# LSTM model
model = Sequential()
model.add(LSTM(32, input_shape=(X.shape[1], 1)))
model.add(Dense(1))
model.compile(optimizer="adam", loss="mse")

model.fit(X, y, epochs=3, batch_size=32, verbose=0)

# Predict next usage
last_seq = scaled[-24:].reshape(1, 24, 1)
pred = model.predict(last_seq)
pred_kwh = scaler.inverse_transform(pred)[0][0]

st.subheader("Predicted Next Night Electricity Usage")
st.write(round(pred_kwh, 2), "kWh")

# Plot recent trend
recent = night_data["kwh"].tail(50)

plt.figure(figsize=(8,4))
plt.plot(recent.values)
plt.title("Recent Night Usage Trend")
plt.xlabel("Time Step")
plt.ylabel("kWh")
st.pyplot(plt.gcf())
