import pandas as pd
import numpy as np
import os

# Define the path to the CSV file
# Assuming Book1.csv is in the parent directory of 'backend' or copied into it.
# We will check both for robustness.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH_REL = os.path.join(BASE_DIR, "../Book1.csv")
CSV_PATH_LOCAL = os.path.join(BASE_DIR, "Book1.csv")

def load_data():
    path = CSV_PATH_REL if os.path.exists(CSV_PATH_REL) else CSV_PATH_LOCAL
    if not os.path.exists(path):
        raise FileNotFoundError(f"Database file not found at {path}")
    
    # Read CSV with ';' delimiter as seen in the file view
    # Handle decimal ',' by specifying decimal=','
    df = pd.read_csv(path, sep=';', decimal=',')
    
    # Clean column names (strip whitespace)
    df.columns = [c.strip() for c in df.columns]
    
    # The file has duplicate column names for ACD and WTW. 
    # Based on the plan:
    # Cols 11 (index 10) -> ACD (Pentacam/Topography)
    # Cols 12 (index 11) -> WTW (Pentacam/Topography)
    # Cols 13 (index 12) -> AL
    # Cols 14 (index 13) -> ACD (Biometer)
    # Cols 15 (index 14) -> WTW (Biometer)
    
    # Let's rename them to be explicit.
    # Pandas handles duplicate columns by adding .1, .2 etc usually, but let's be safe and rename by index.
    columns = list(df.columns)
    
    # Check if structure matches expectation (approximate check)
    # We expect 'AL' at index 12 based on the file view: 
    # Age;Genre;Eye;Sph;Cyl;Axis;K1;Axis1;K2;Axis2;ACD;WTW;AL;ACD;WTW
    # 0   1     2   3   4    5   6  7     8  9     10  11  12 13  14
    
    if len(columns) >= 15:
        # Renaming for clarity
        df.columns.values[10] = 'ACD_Topo'
        df.columns.values[11] = 'WTW_Topo'
        df.columns.values[12] = 'AL'
        df.columns.values[13] = 'ACD_Bio'
        df.columns.values[14] = 'WTW_Bio'
        
        # Reload with new names to ensure dataframe uses them
        df = df.rename(columns={
            df.columns[10]: 'ACD_Topo',
            df.columns[11]: 'WTW_Topo',
            df.columns[12]: 'AL',
            df.columns[13]: 'ACD_Bio',
            df.columns[14]: 'WTW_Bio'
        })

    # Ensure numeric types
    numeric_cols = ['ACD_Topo', 'WTW_Topo', 'AL', 'ACD_Bio', 'WTW_Bio']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            
    # Calculate Ratios
    if 'WTW_Topo' in df.columns and 'ACD_Topo' in df.columns:
        df['Ratio_Topo'] = df['WTW_Topo'] / df['ACD_Topo']
        
    if 'WTW_Bio' in df.columns and 'ACD_Bio' in df.columns:
        df['Ratio_Bio'] = df['WTW_Bio'] / df['ACD_Bio']
        
    return df

def get_stats():
    df = load_data()
    stats = {}
    
    target_columns = ['ACD_Topo', 'WTW_Topo', 'AL', 'ACD_Bio', 'WTW_Bio', 'Ratio_Topo', 'Ratio_Bio']
    
    for col in target_columns:
        if col in df.columns:
            valid_data = df[col].dropna()
            stats[col] = {
                "mean": float(valid_data.mean()),
                "std": float(valid_data.std()),
                "min": float(valid_data.min()),
                "max": float(valid_data.max()),
                "count": int(valid_data.count())
            }
    return stats

def calculate_z_score(value, mean, std):
    if std == 0:
        return 0
    return (value - mean) / std

def get_percentile(z):
    from scipy.stats import norm
    return norm.cdf(z) * 100
