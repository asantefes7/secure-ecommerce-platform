# ml-fraud-detection/fraud_model.py
import pickle
import numpy as np
import json
import sys

# Load the pre-trained model
with open('fraud_model.pkl', 'rb') as f:
    model = pickle.load(f)

# Read arguments from command line
if len(sys.argv) != 4:
    print(json.dumps({"error": "Invalid arguments"}))
    sys.exit(1)

try:
    amount = float(sys.argv[1])
    item_count = int(sys.argv[2])
    user_order_count = int(sys.argv[3])
except ValueError:
    print(json.dumps({"error": "Invalid number format"}))
    sys.exit(1)

# Prepare features
features = np.array([[amount, item_count, user_order_count]])

# Predict fraud probability
prob = model.predict_proba(features)[0][1]  # Probability of fraud class

# Convert NumPy types to plain Python types
score = float(round(prob * 100, 2))
is_fraud = bool(score > 70)  # Convert numpy.bool_ to Python bool

result = {
    "score": score,
    "is_fraud": is_fraud,
    "reason": "High amount" if amount > 100 else "Multiple items" if item_count > 5 else "New user"
}

# Output clean JSON only
print(json.dumps(result))