#!/usr/bin/env python3
"""
Test script for report generation API
"""
import requests
import json
import os
from io import BytesIO

# API base URL
BASE_URL = "http://localhost:8000"

def test_list_reports():
    """Test the list reports endpoint"""
    url = f"{BASE_URL}/api/reports/list"
    
    try:
        print("Testing list reports endpoint...")
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Reports listed successfully!")
            print(f"Number of reports: {len(result.get('reports', []))}")
            for report in result.get('reports', []):
                print(f"  - Report ID: {report.get('id')}")
                print(f"    Patient ID: {report.get('patient_id')}")
                print(f"    Created: {report.get('created_at')}")
                print(f"    Transcription: {report.get('transcription', '')[:50]}...")
                print()
        else:
            print("❌ Failed to list reports!")
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error! Make sure the API server is running.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_add_report_with_dummy_audio():
    """Test the add report endpoint with dummy audio data"""
    url = f"{BASE_URL}/api/reports/add"
    
    # Create a dummy audio file (this won't actually work with Whisper, but tests the endpoint)
    dummy_audio_content = b"dummy audio content for testing"
    
    try:
        print("Testing add report endpoint with dummy audio...")
        print("⚠️  Note: This will fail at the transcription step since we're using dummy audio")
        
        # Use a valid patient ID from previous tests
        patient_id = "8cc7dcee-e22e-436d-adf6-504b53568f4b"  # John Doe's ID
        
        files = {
            'audio_file': ('test_audio.webm', dummy_audio_content, 'audio/webm')
        }
        
        data = {
            'patient_id': patient_id,
            'department': 'general'
        }
        
        response = requests.post(url, files=files, data=data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Report created successfully!")
            print(f"Report ID: {result.get('id')}")
            print(f"Patient ID: {result.get('patient_id')}")
            print(f"Department: {result.get('department')}")
            print(f"Transcription: {result.get('transcription', '')[:100]}...")
            print(f"Clinical Report: {result.get('report', '')[:100]}...")
            print(f"AI Summary: {result.get('summary', '')[:100]}...")
        else:
            print("❌ Report creation failed (expected with dummy audio)!")
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error! Make sure the API server is running.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_file_upload_validation():
    """Test file upload validation"""
    url = f"{BASE_URL}/api/reports/add"
    
    try:
        print("\nTesting file upload validation...")
        
        # Test with invalid file type
        print("1. Testing with invalid file type...")
        files = {
            'audio_file': ('test.txt', b"text content", 'text/plain')
        }
        data = {
            'patient_id': "8cc7dcee-e22e-436d-adf6-504b53568f4b",
            'department': 'general'
        }
        
        response = requests.post(url, files=files, data=data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ File type validation working!")
            print(f"Error message: {response.json().get('detail', '')}")
        else:
            print("❌ File type validation not working as expected")
        
        # Test with empty file
        print("\n2. Testing with empty file...")
        files = {
            'audio_file': ('empty.webm', b"", 'audio/webm')
        }
        
        response = requests.post(url, files=files, data=data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ Empty file validation working!")
            print(f"Error message: {response.json().get('detail', '')}")
        else:
            print("❌ Empty file validation not working as expected")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error! Make sure the API server is running.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def print_usage_instructions():
    """Print instructions for using the report API"""
    print("\n" + "="*60)
    print("📋 REPORT API USAGE INSTRUCTIONS")
    print("="*60)
    print("\n🎙️  To use the enhanced report API in production:")
    print("1. Record doctor-patient conversation from microphone")
    print("2. Save as .webm, .wav, or .mp3 format")
    print("3. Send POST request to /api/reports/add with:")
    print("   - patient_id: UUID of existing patient")
    print("   - department: Medical department (general, cardiology, ent, etc.)")
    print("   - audio_file: The recorded conversation file")
    print("\n📝 Example with curl:")
    print("curl -X POST http://localhost:8000/api/reports/add \\")
    print("  -F 'patient_id=8cc7dcee-e22e-436d-adf6-504b53568f4b' \\")
    print("  -F 'department=cardiology' \\")
    print("  -F 'audio_file=@doctor_conversation.webm'")
    print("\n🔑 Requirements:")
    print("- Valid OpenAI API key in .env file")
    print("- Patient must exist in users table")
    print("- Audio file must be < 10MB")
    print("- Supported formats: webm, wav, mp3, m4a")
    print("- Valid department: general, cardiology, ent, neurology, orthopedics, pediatrics, dermatology")
    print("\n📊 Enhanced AI Processing:")
    print("1. Transcribe audio using OpenAI Whisper")
    print("2. Clean transcription (remove filler words)")
    print("3. Extract clinical context (vitals, symptoms, locations)")
    print("4. Generate department-specific medical report using GPT-3.5")
    print("5. Create AI summary with health alerts")
    print("6. Save all data to Supabase reports table")
    print("7. Return comprehensive medical report with AI insights")

if __name__ == "__main__":
    print("OneAI Report API Test")
    print("=" * 30)
    
    # Test list reports
    test_list_reports()
    print()
    
    # Test file upload validation
    test_file_upload_validation()
    print()
    
    # Test add report with dummy audio (will fail at transcription)
    test_add_report_with_dummy_audio()
    
    # Print usage instructions
    print_usage_instructions() 