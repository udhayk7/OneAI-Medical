#!/usr/bin/env python3
"""
Test script for token generation API
"""
import requests
import json

# API base URL
BASE_URL = "http://localhost:8000"

def test_generate_token():
    """Test the token generation endpoint"""
    url = f"{BASE_URL}/api/tokens/generate-token"
    
    # Test data
    test_data = {
        "patient_id": "patient_123"
    }
    
    try:
        print(f"Testing token generation for patient: {test_data['patient_id']}")
        
        response = requests.post(
            url,
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Token generated successfully!")
            print(f"Token Code: {result['token_code']}")
            print(f"Patient ID: {result['patient_id']}")
            print(f"Created At: {result['created_at']}")
            print(f"Expires At: {result['expires_at']}")
        else:
            print("❌ Token generation failed!")
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error! Make sure the API server is running.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_health_check():
    """Test the health check endpoint"""
    url = f"{BASE_URL}/health"
    
    try:
        response = requests.get(url)
        print(f"Health Check Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Health Check: {result['status']}")
        else:
            print("❌ Health check failed!")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error! Make sure the API server is running.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("OneAI Backend API Test")
    print("=" * 30)
    
    # Test health check first
    test_health_check()
    print()
    
    # Test token generation
    test_generate_token() 