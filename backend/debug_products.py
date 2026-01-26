import pandas as pd
import json

try:
    df = pd.read_excel('excel/barb-alpha.xlsx', sheet_name='products')
    result = {
        "columns": list(df.columns),
        "first_row": df.iloc[0].to_dict() if not df.empty else "Empty",
        "total_rows": len(df)
    }
    with open('product_debug.json', 'w') as f:
        json.dump(result, f, indent=2, default=str)
except Exception as e:
    with open('product_debug.json', 'w') as f:
        f.write(str(e))
