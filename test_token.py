from jose import jwt
from app.services.auth_service import SECRET_KEY, ALGORITHM

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBhZ2VuY2lhLWdyb3d0aC5jb20iLCJyb2xlX2xvY2FsIjoiYWRtaW4iLCJ0ZW5hbnRfc2x1ZyI6ImFnZW5jaWEtZ3Jvd3RoIiwidGVuYW50X2lkIjoiYTg1MDkwMDItNjA5My00ZTEyLTljN2MtZjlhOGI3ODhjZDFjIiwiZXhwIjoxNzcwOTg4MTU4fQ.hmnX2fnnRT0wR1QQzE2qIYxLbpTh_tSYOvhLqDlXvLc"

import time
from datetime import datetime, timezone
now_ts = time.time()
now_dt = datetime.fromtimestamp(now_ts, tz=timezone.utc)
exp_ts = 1770988158
exp_dt = datetime.fromtimestamp(exp_ts, tz=timezone.utc)

print(f"Now (UTC): {now_dt}")
print(f"Exp (UTC): {exp_dt}")
print(f"Diff:      {exp_ts - now_ts}s")

try:
    # Use options to disable exp check just to see if signature is valid
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
    print("Signature Valid. Payload:", payload)
    
    # Now check with exp
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    print("Token is valid and NOT expired.")
except Exception as e:
    print("Failure:", type(e).__name__, ":", str(e))
