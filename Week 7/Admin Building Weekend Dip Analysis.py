import pandas as pd
import numpy as np
import streamlit as st
import plotly.express as px
from sklearn.cluster import KMeans
from sklearn.linear_model import LinearRegression

st.title("Admin Building Weekend Dip Analysis")

DATA_PATH = r"D:\SEM 6\Hack-O-Week\Feb\Week3\electricityloaddiagrams20112014\LD2011_2014.txt"

@st.cache_data
def load_data():
    df = pd.read_csv(DATA_PATH, sep=";", decimal=",")
    df.rename(columns={df.columns[0]: "timestamp"}, inplace=True)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df.set_index("timestamp", inplace=True)
    return df

df = load_data()

# Convert 15-min kW to kWh
df = df / 4

# Hourly aggregation
hourly = df.resample("H").sum()

# Select one meter as admin building
meter = hourly.columns[0]
data = hourly[[meter]].copy()
data.columns = ["kwh"]

# Create daily usage profiles
daily = data.resample("D").sum()
daily["dayofweek"] = daily.index.dayofweek
daily["is_weekend"] = daily["dayofweek"] >= 5

# K-Means clustering on usage profile
kmeans = KMeans(n_clusters=2, random_state=42)
daily["cluster"] = kmeans.fit_predict(daily[["kwh"]])

# Regression per cluster
predictions = []

for c in daily["cluster"].unique():
    subset = daily[daily["cluster"] == c]

    X = np.arange(len(subset)).reshape(-1,1)
    y = subset["kwh"].values

    model = LinearRegression()
    model.fit(X,y)

    next_val = model.predict([[len(subset)]])[0]
    predictions.append(next_val)

# Calculate savings potential
weekday_avg = daily[~daily["is_weekend"]]["kwh"].mean()
weekend_avg = daily[daily["is_weekend"]]["kwh"].mean()

savings = weekday_avg - weekend_avg

st.subheader("Estimated Savings Potential")
st.write(round(savings,2),"kWh reduction on weekends")

# Pie chart
pie_df = pd.DataFrame({
    "Category":["Used Energy","Potential Savings"],
    "Value":[weekend_avg, savings]
})

fig = px.pie(pie_df, names="Category", values="Value", title="Weekend Savings Potential")
st.plotly_chart(fig, use_container_width=True)

# Cluster visualization
cluster_fig = px.scatter(
    daily.reset_index(),
    x="timestamp",
    y="kwh",
    color="cluster",
    title="Usage Clusters (Weekday vs Weekend Patterns)"
)

st.plotly_chart(cluster_fig, use_container_width=True)