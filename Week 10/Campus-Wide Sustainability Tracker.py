import pandas as pd
import streamlit as st
import plotly.express as px
from sklearn.linear_model import LinearRegression

st.title("Campus-Wide Sustainability Tracker")

DATA_PATH = "LD2011_2014.txt"

@st.cache_data
def load_data():
    df = pd.read_csv(DATA_PATH, sep=";", decimal=",")
    df.rename(columns={df.columns[0]: "timestamp"}, inplace=True)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df.set_index("timestamp", inplace=True)
    return df

df = load_data()

# Convert kW (15 min) to kWh
df_kwh = df / 4

# Convert to hourly energy
hourly = df_kwh.resample("H").sum()

# Select first 5 meters as campus buildings
campus = hourly.iloc[:,0:5]

campus.columns = [
"Hostel",
"Admin Building",
"Cafeteria",
"Library",
"Sports Complex"
]

# Total campus energy
campus["Total Energy"] = campus.sum(axis=1)

# Moving average smoothing
campus["Smoothed"] = campus["Total Energy"].rolling(5,min_periods=1).mean()

# Regression forecast
data = campus.reset_index()
data["time_index"] = range(len(data))

X = data[["time_index"]]
y = data["Total Energy"]

model = LinearRegression()
model.fit(X,y)

data["predicted"] = model.predict(X)

# Carbon estimation
CARBON_FACTOR = 0.82
data["carbon_emission"] = data["Total Energy"] * CARBON_FACTOR
data["carbon_saved"] = data["carbon_emission"].max() - data["carbon_emission"]

st.subheader("Campus Energy Trend")

fig1 = px.line(
    data,
    x="timestamp",
    y=["Total Energy","Smoothed","predicted"],
    title="Campus Energy Consumption Trend"
)

st.plotly_chart(fig1,use_container_width=True)

st.subheader("Carbon Emissions")

fig2 = px.line(
    data,
    x="timestamp",
    y="carbon_emission",
    title="Estimated Carbon Emissions"
)

st.plotly_chart(fig2,use_container_width=True)

st.subheader("Building Energy Breakdown")

fig3 = px.bar(
    campus.tail(1).T,
    title="Current Energy Consumption by Building"
)

st.plotly_chart(fig3,use_container_width=True)

st.metric(
    "Estimated Carbon Savings",
    str(round(data["carbon_saved"].mean(),2)) + " kg CO2"
)
