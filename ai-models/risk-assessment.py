import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import numpy as np

# Sample dataset - in production this would come from your database
data = {
    'age': np.random.randint(18, 70, 1000),
    'location_risk': np.random.randint(1, 11, 1000),  # 1-10 scale
    'health_history': np.random.randint(0, 5, 1000),  # 0-4 scale
    'claims_history': np.random.randint(0, 10, 1000), # Number of past claims
    'risk_level': np.random.randint(0, 3, 1000)       # 0=low, 1=medium, 2=high
}

df = pd.DataFrame(data)

# Split data
X = df.drop('risk_level', axis=1)
y = df['risk_level']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Train model
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# Save model
joblib.dump(model, 'risk-assessment-model.pkl')

def predict_risk(age, location_risk, health_history, claims_history):
    """Predict risk level for a new user"""
    input_data = [[age, location_risk, health_history, claims_history]]
    prediction = model.predict(input_data)
    risk_levels = ['low', 'medium', 'high']
    return risk_levels[prediction[0]]

# Test prediction
print(predict_risk(35, 5, 2, 1))  # Example prediction