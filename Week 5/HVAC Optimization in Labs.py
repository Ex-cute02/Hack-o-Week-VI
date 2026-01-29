import pandas as pd
import streamlit as st
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.tree import DecisionTreeClassifier

st.title("HVAC Optimization in Labs")

DATA_PATH = "D:\Hack-O-Week\Feb\Week1\Occupancy_Estimation.csv"

@st.cache_data
def load_data():
    df = pd.read_csv(DATA_PATH)
    df.columns = df.columns.str.strip()
    df["timestamp"] = pd.to_datetime(df["Date"] + " " + df["Time"])
    return df

df = load_data()

# Use multiple temperature sensors (better representation)
df["Avg_Temp"] = df[["S1_Temp","S2_Temp","S3_Temp","S4_Temp"]].mean(axis=1)

df = df[["timestamp","Avg_Temp","Room_Occupancy_Count"]]

# Create cooling label
def cooling_label(row):
    if row["Avg_Temp"] > 26 and row["Room_Occupancy_Count"] >= 2:
        return "High"
    elif row["Avg_Temp"] > 24:
        return "Medium"
    else:
        return "Low"

df["Cooling_Need"] = df.apply(cooling_label, axis=1)

# Train Decision Tree
X = df[["Avg_Temp","Room_Occupancy_Count"]]
y = df["Cooling_Need"]

model = DecisionTreeClassifier(max_depth=3)
model.fit(X,y)

# Predict on recent data
recent = X.tail(200)
pred = model.predict(recent)

viz_df = recent.copy()
viz_df["Cooling"] = pred

# Convert to numeric
viz_df["Cooling_Code"] = viz_df["Cooling"].map({"Low":0,"Medium":1,"High":2})

# Create bins for heatmap (zones)
viz_df["Temp_Bin"] = pd.cut(viz_df["Avg_Temp"], bins=5)
viz_df["Occ_Bin"] = pd.cut(viz_df["Room_Occupancy_Count"], bins=5)

heatmap_data = viz_df.pivot_table(
    values="Cooling_Code",
    index="Occ_Bin",
    columns="Temp_Bin",
    aggfunc="mean"
)

st.subheader("Zone-wise Cooling Requirement Heatmap")

plt.figure(figsize=(10,6))
sns.heatmap(
    heatmap_data,
    annot=True,
    cmap="YlOrRd",
    linewidths=0.5
)
plt.xlabel("Temperature Zones")
plt.ylabel("Occupancy Zones")
st.pyplot(plt.gcf())
