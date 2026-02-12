import openpyxl
import os

path = r"c:\Users\JOAO PEDRO\Desktop\CRM Saas\backend\app\excel\master.xlsx"
if os.path.exists(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    sheet = wb["users_master"]
    for row in sheet.iter_rows(values_only=True):
        print(row)
else:
    print("Master Excel not found")
