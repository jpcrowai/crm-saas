import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv("backend/.env")

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)

sub_id = "13c552fd-810f-425b-91eb-7fd5f84c28b3"

with engine.connect() as conn:
    query = text('SELECT id, tenant_id, contract_url, status FROM "public".subscriptions WHERE id = :sub_id')
    result = conn.execute(query, {"sub_id": sub_id}).fetchone()

    if result:
        print(f"ID: {result[0]}")
        print(f"Tenant ID: {result[1]}")
        print(f"Contract URL: {result[2]}")
        print(f"Status: {result[3]}")
    else:
        print("Subscription not found in DB")
