# Week 4: Cafeteria Load Prediction

## Prerequisites

### System Requirements

- **Python**: 3.8 or higher
- **Operating System**: Windows, macOS, or Linux
- **Memory**: Minimum 4GB RAM recommended
- **Network**: Internet connection for WebSocket functionality

### Required Python Libraries

Install the following packages using pip:

```bash
pip install pandas numpy plotly scikit-learn websockets asyncio requests
```

### Core Dependencies

| Package | Purpose |
|---------|---------|
| `pandas` | Data manipulation and analysis |
| `numpy` | Numerical computing |
| `plotly` | Interactive visualizations |
| `scikit-learn` | Machine learning (Linear Regression) |
| `websockets` | Real-time WebSocket communication |
| `asyncio` | Asynchronous programming |
| `requests` | HTTP requests (for weather APIs) |

### Installation Commands

#### Quick Install (All at once)
```bash
pip install pandas numpy plotly scikit-learn websockets requests
```

#### Individual Install (If needed)
```bash
pip install pandas
pip install numpy
pip install plotly
pip install scikit-learn
pip install websockets
pip install requests
```

## Verification

Test your installation by running:

```python
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from sklearn.linear_model import LinearRegression
import websockets
import asyncio

print("All Week 4 prerequisites installed successfully!")
```

## Features

- **Weather-based Prediction**: Uses temperature, humidity, and precipitation data
- **Linear Regression Model**: Predicts cafeteria load based on weather conditions
- **Real-time Updates**: WebSocket integration for live predictions
- **Interactive Dashboard**: Multi-panel visualization with real-time charts
- **Load Categories**: Automatic classification (High/Medium/Low)

## Network Requirements

- **WebSocket Support**: For real-time communication
- **Port Access**: Default WebSocket port (8765) should be available

## Ready to Run

Once all prerequisites are installed, you can run:
- `Week 4/cafeteria_load_prediction.ipynb`

## Expected Runtime

- **Model Training**: 1-2 seconds
- **Dashboard Generation**: 3-5 seconds
- **WebSocket Demo**: 1-2 seconds