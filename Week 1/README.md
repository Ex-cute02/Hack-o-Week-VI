# Week 1: Household Power Consumption Analysis

## Prerequisites

### System Requirements

- **Python**: 3.8 or higher
- **Operating System**: Windows, macOS, or Linux
- **Memory**: Minimum 4GB RAM recommended (dataset is ~1M rows)
- **Storage**: At least 1GB free space for dataset download

### Required Python Libraries

Install the following packages using pip:

```bash
pip install kagglehub plotly scikit-learn pandas
```

### Core Dependencies

| Package | Purpose |
|---------|---------|
| `kagglehub` | Download Kaggle datasets |
| `plotly` | Interactive visualizations |
| `scikit-learn` | Machine learning (Linear Regression) |
| `pandas` | Data manipulation and analysis |

### Installation Commands

#### Quick Install (All at once)
```bash
pip install kagglehub plotly scikit-learn pandas
```

#### Individual Install (If needed)
```bash
pip install kagglehub
pip install plotly
pip install scikit-learn
pip install pandas
```

### Additional Dependencies (Auto-installed)
- `numpy` - Numerical computing (comes with pandas/scikit-learn)
- `matplotlib` - Plotting backend (comes with plotly)

## Verification

Test your installation by running:

```python
import pandas as pd
import plotly.graph_objects as go
from sklearn.linear_model import LinearRegression
import kagglehub

print("All Week 1 prerequisites installed successfully!")
```

## Dataset Information

- **Source**: Kaggle Household Power Consumption Dataset
- **Size**: ~1M rows of minute-by-minute power data
- **Download**: Automatic via KaggleHub (no Kaggle account required)
- **Format**: CSV with comma separation

## Network Requirements

- **Internet Connection**: Required for initial dataset download (~20MB)
- **Firewall**: Ensure Python can access `kaggle.com` and `kagglehub.com`

## Troubleshooting

### Common Issues

1. **ModuleNotFoundError**: Run `pip install <package_name>`
2. **Permission Error**: Use `pip install --user <package_name>`
3. **Dataset Download Fails**: Check internet connection and firewall settings
4. **Memory Error**: Close other applications or use a machine with more RAM

### Platform-Specific Notes

- **Windows**: May need Visual Studio Build Tools for scikit-learn
- **macOS**: Ensure Xcode Command Line Tools are installed
- **Linux**: May need `python3-dev` package

## Ready to Run

Once all prerequisites are installed, you can run:
- `Week 1/household_power_analysis_final.ipynb`

## Expected Runtime

- **First run**: 2-5 minutes (includes dataset download)
- **Subsequent runs**: 30-60 seconds (dataset cached locally)