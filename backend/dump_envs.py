from app.services.excel_service import read_sheet
import json
import os

try:
    data = read_sheet('ambientes', 'ambientes')
    with open('env_dump.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("Dump successful")
except Exception as e:
    print(f"Error: {e}")
