# Prerequisites

## System Requirements

- **Python**: 3.8 or higher
- **Operating System**: Windows, macOS, or Linux
- **Memory**: Minimum 4GB RAM recommended
- **Storage**: At least 500MB free space

## Required Python Libraries

Install the following packages using pip:

```bash
pip install pandas numpy plotly statsmodels ucimlrepo
```

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `pandas` | ≥1.0.0 | Data manipulation and analysis |
| `numpy` | ≥1.26.0 | Numerical computing |
| `plotly` | ≥5.0.0 | Interactive visualizations |
| `statsmodels` | ≥0.13.0 | ARIMA time series modeling |
| `ucimlrepo` | ≥0.0.7 | UCI ML repository data access |

### Optional Dependencies

```bash
pip install jupyter notebook  # For running Jupyter notebooks
```

## Installation Commands

### Quick Install (All at once)
```bash
pip install pandas numpy plotly statsmodels ucimlrepo jupyter
```

### Individual Install (If needed)
```bash
pip install pandas
pip install numpy  
pip install plotly
pip install statsmodels
pip install ucimlrepo
pip install jupyter
```

## Verification

Test your installation by running:

```python
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from statsmodels.tsa.arima.model import ARIMA
from ucimlrepo import fetch_ucirepo

print("All prerequisites installed successfully!")
```

## Network Requirements

- **Internet Connection**: Required for downloading UCI dataset
- **Firewall**: Ensure Python can access `archive.ics.uci.edu`

## Troubleshooting

### Common Issues

1. **ModuleNotFoundError**: Run `pip install <package_name>`
2. **Permission Error**: Use `pip install --user <package_name>`
3. **Version Conflicts**: Create a virtual environment:
   ```bash
   python -m venv arima_env
   source arima_env/bin/activate  # On Windows: arima_env\Scripts\activate
   pip install pandas numpy plotly statsmodels ucimlrepo
   ```

### Platform-Specific Notes

- **Windows**: May need Visual Studio Build Tools for some packages
- **macOS**: Ensure Xcode Command Line Tools are installed
- **Linux**: May need `python3-dev` package

## Ready to Run

Once all prerequisites are installed, you can run:
- `Week 2/uci_occupancy_forecast_final.ipynb`