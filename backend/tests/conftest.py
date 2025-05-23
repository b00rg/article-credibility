import pytest
import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

print("Current Python Path:", sys.path)

# Set environment variables for testing
os.environ["HF_TOKEN"] = "hf_token"