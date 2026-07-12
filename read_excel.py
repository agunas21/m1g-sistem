import pandas as pd
import json

try:
    df = pd.read_excel(r'C:\Users\gunas\Desktop\M1g\EKİP LİSTE ŞABLOM.xlsx')
    # Print the columns
    print("COLUMNS:")
    print(df.columns.tolist())
    # Print the first 5 rows
    print("\nFIRST 5 ROWS:")
    print(df.head(5).to_json(orient='records', force_ascii=False, indent=2))
except Exception as e:
    print("Error:", e)
