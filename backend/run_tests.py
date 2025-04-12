import pytest
import sys
import os

if __name__ == "__main__":
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Run pytest with the tests directory
    sys.exit(pytest.main([os.path.join(script_dir, "tests")]))

print("Current Working Directory:", os.getcwd()) 