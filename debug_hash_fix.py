from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")

# O hash que está no banco contém um ponto (.) que separa o salt e o hash. 
# O passlib espera cifrões ($) como separadores.
hash_in_db = "$pbkdf2-sha256$29000$O2fs/V9rwv9VRx880oLHZ9eI7eCcAh2XFAoaYY.KeiRGcmLVjckzMpb2Hyp/fspuPcHKK"

# Vamos tentar converter o ponto para cifrão antes do hash final
fixed_hash = hash_in_db.replace(".", "$")

print(f"Original: {hash_in_db}")
print(f"Fixed   : {fixed_hash}")

try:
    match = pwd_context.verify("Admin@123", fixed_hash)
    print(f"Match Admin@123: {match}")
except Exception as e:
    print(f"Erro com Admin@123: {e}")

try:
    match_alt = pwd_context.verify("Teste@123", fixed_hash)
    print(f"Match Teste@123: {match_alt}")
except Exception as e:
    print(f"Erro com Teste@123: {e}")
