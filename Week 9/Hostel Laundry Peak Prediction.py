import pandas as pd
import streamlit as st
import plotly.express as px
from sklearn.naive_bayes import GaussianNB
from prophet import Prophet

st.title("Hostel Laundry Peak Prediction")

DATA_PATH = r"D:\SIT\SEM 6\Hack-O-Week\Feb\Week5\KAG_energydata_complete.csv"

@st.cache_data
def load_data():
    df = pd.read_csv(DATA_PATH)

    # clean column names
    df.columns = df.columns.str.strip()

    # convert date column
    df["date"] = pd.to_datetime(df["date"], format="mixed", errors="coerce")

    return df

df = load_data()

# Create usage categories
df["usage_category"] = pd.cut(
    df["Appliances"],
    bins=[0,40,80,1000],
    labels=["Low","Medium","High"]
)

# Features for Naive Bayes
X = df[["T3","RH_3","T_out","RH_out"]]
y = df["usage_category"]

# Combine with appliances and remove missing rows
data = pd.concat([df["Appliances"], X, y], axis=1).dropna()

X = data[["T3","RH_3","T_out","RH_out"]]
y = data["usage_category"]

# Train model
nb_model = GaussianNB()
nb_model.fit(X, y)

data["predicted_usage"] = nb_model.predict(X)

st.subheader("Recent Laundry Usage Category Prediction")
st.write(data[["Appliances","predicted_usage"]].tail())

# Prophet forecasting
prophet_df = df[["date","Appliances"]].dropna()
prophet_df.columns = ["ds","y"]

model = Prophet()
model.fit(prophet_df)

future = model.make_future_dataframe(periods=48, freq="H")
forecast = model.predict(future)

st.subheader("Laundry Electricity Usage Forecast")

step = st.slider("Select timeline range",10,len(forecast)-1,200)

fig = px.line(
    forecast.iloc[:step],
    x="ds",
    y="yhat",
    title="Predicted Hostel Laundry Electricity Usage"
)

st.plotly_chart(fig, use_container_width=True)

st.subheader("Forecast Data")
st.write(forecast[["ds","yhat"]].tail())