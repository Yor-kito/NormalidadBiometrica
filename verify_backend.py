import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from backend import data_processing
    stats = data_processing.get_stats()
    print("SUCCESS: Stats loaded.")
    print(f"WTW Mean: {stats['WTW_Topo']['mean']}")
    print(f"ACD Mean: {stats['ACD_Topo']['mean']}")
except Exception as e:
    print(f"ERROR: {e}")
