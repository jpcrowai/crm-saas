from passlib.context import CryptContext
import bcrypt

try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    print("Hashing...")
    hash_val = pwd_context.hash("Teste@123")
    print(f"Hash: {hash_val}")
    print("Verifying...")
    print(pwd_context.verify("Teste@123", hash_val))
except Exception as e:
    print(f"Error: {e}")
