
try:
    print("Importing httpx...")
    import httpx
    print(f"httpx version: {httpx.__version__}")

    print("Importing httpcore...")
    import httpcore
    print("httpcore imported successfully.")

    print("Importing supabase...")
    import supabase
    print("supabase imported successfully.")

    print("Importing postgrest...")
    import postgrest
    print("postgrest imported successfully.")

    print("\nSUCCESS: All critical imports work. The server should start.")
except ImportError as e:
    print(f"\nFAILURE: ImportError: {e}")
except AttributeError as e:
    print(f"\nFAILURE: AttributeError (runtime crash): {e}")
except Exception as e:
    print(f"\nFAILURE: Unexpected error: {e}")
