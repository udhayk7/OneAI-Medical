from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from datetime import datetime
import uuid
import os
import tempfile
import re
import aiofiles
from config import supabase_admin, openai_client
from models import ReportRequest, ReportResponse, ErrorResponse

router = APIRouter(prefix="/api/reports", tags=["reports"])

# Allowed audio file types
ALLOWED_AUDIO_TYPES = [
    "audio/webm",
    "audio/wav", 
    "audio/mp3",
    "audio/m4a",
    "audio/mp4",
    "audio/mpeg",
    "audio/mpga",
    "audio/webm;codecs=opus"
]

# Maximum file size (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024

# Department types
DEPARTMENTS = ["general", "cardiology", "ent", "neurology", "orthopedics", "pediatrics", "dermatology"]

def clean_transcription(text: str) -> str:
    """Clean transcription by removing filler words and excessive small talk"""
    # Remove common filler words and phrases
    filler_words = [
        r'\b(um|uh|er|ah|hmm|mm|hm)\b',
        r'\b(you know|like|well|so|basically|actually|literally)\b',
        r'\b(okay|ok|right|yeah|yes|yep|uh-huh|mm-hmm)\b(?=\s)',
        r'\b(and then|and so|and like)\b',
        r'\.\.\.',
        r'\s+',  # multiple spaces
    ]
    
    cleaned = text
    for pattern in filler_words:
        cleaned = re.sub(pattern, ' ', cleaned, flags=re.IGNORECASE)
    
    # Clean up extra spaces and normalize
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

def extract_clinical_context(transcription: str) -> dict:
    """Extract key clinical information from transcription"""
    context = {
        'vitals': [],
        'symptoms': [],
        'locations': [],
        'medications': [],
        'allergies': []
    }
    
    # Extract vitals (BP, temperature, heart rate, etc.)
    vital_patterns = [
        r'(?:BP|blood pressure|pressure)\s*:?\s*(\d+(?:/\d+)?)',
        r'(?:temperature|temp|fever)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:°?[FC]?)',
        r'(?:heart rate|pulse|HR)\s*:?\s*(\d+)\s*(?:bpm|beats)',
        r'(?:weight)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:kg|lbs)',
        r'(?:height)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:cm|ft|feet)',
        r'(?:oxygen|O2|saturation)\s*:?\s*(\d+)%?'
    ]
    
    for pattern in vital_patterns:
        matches = re.findall(pattern, transcription, re.IGNORECASE)
        context['vitals'].extend(matches)
    
    # Extract locations (for outbreak tracking)
    location_patterns = [
        r'(?:from|in|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        r'(?:district|city|place|area)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'
    ]
    
    for pattern in location_patterns:
        matches = re.findall(pattern, transcription, re.IGNORECASE)
        context['locations'].extend(matches)
    
    # Extract common symptoms
    symptom_keywords = [
        'pain', 'fever', 'cough', 'headache', 'nausea', 'vomiting', 'diarrhea',
        'fatigue', 'dizziness', 'shortness of breath', 'chest pain', 'abdominal pain',
        'joint pain', 'muscle pain', 'sore throat', 'runny nose', 'congestion'
    ]
    
    for symptom in symptom_keywords:
        if symptom.lower() in transcription.lower():
            context['symptoms'].append(symptom)
    
    return context

def get_department_prompt(department: str) -> str:
    """Get department-specific prompt adjustments"""
    department_prompts = {
        "general": "Focus on overall health assessment and common conditions. Consider preventive care recommendations.",
        "cardiology": "Pay special attention to cardiovascular symptoms, risk factors, and heart-related conditions. Include cardiac risk stratification.",
        "ent": "Focus on ear, nose, and throat conditions. Consider hearing, balance, sinus, and throat-related symptoms.",
        "neurology": "Emphasize neurological symptoms, cognitive function, and nervous system disorders. Include mental status assessment.",
        "orthopedics": "Focus on musculoskeletal conditions, joint mobility, and bone health. Include functional assessment.",
        "pediatrics": "Consider age-appropriate developmental milestones and pediatric-specific conditions. Include growth parameters.",
        "dermatology": "Focus on skin conditions, lesions, and dermatological symptoms. Include detailed skin examination findings."
    }
    
    return department_prompts.get(department.lower(), department_prompts["general"])

def generate_health_alerts(context: dict) -> str:
    """Generate health alerts based on location and symptoms"""
    alerts = []
    
    # Example outbreak tracking (you can expand this with real data)
    outbreak_areas = {
        'wayanad': 'Recent dengue outbreak reported in Wayanad district',
        'kerala': 'Monitor for tropical diseases common in Kerala region',
        'mumbai': 'Air quality concerns - consider respiratory symptoms',
        'delhi': 'High pollution levels - evaluate respiratory and cardiovascular impact'
    }
    
    for location in context['locations']:
        location_lower = location.lower()
        for area, alert in outbreak_areas.items():
            if area in location_lower:
                alerts.append(alert)
    
    return '. '.join(alerts) if alerts else ""

@router.post("/add", response_model=ReportResponse)
async def add_report(
    patient_id: str = Form(...),
    department: str = Form(...),
    audio_file: UploadFile = File(...)
):
    """
    Enhanced clinical voice-to-report generation with department-specific processing
    
    Args:
        patient_id: ID of the patient
        department: Medical department (general, cardiology, ent, etc.)
        audio_file: Doctor-patient conversation audio file
        
    Returns:
        ReportResponse: Created report with transcription, clinical report, and AI summary
    """
    try:
        # Validate department
        if department.lower() not in [d.lower() for d in DEPARTMENTS]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid department. Allowed: {', '.join(DEPARTMENTS)}"
            )
        
        # Validate file type
        if audio_file.content_type not in ALLOWED_AUDIO_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported audio format. Allowed types: {', '.join(ALLOWED_AUDIO_TYPES)}"
            )
        
        # Read file content and check size
        audio_content = await audio_file.read()
        
        if len(audio_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024*1024):.1f}MB"
            )
        
        if len(audio_content) == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty audio file provided"
            )
        
        # Create temporary file for OpenAI Whisper
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
            temp_file.write(audio_content)
            temp_file_path = temp_file.name
        
        try:
            # Step 1: Transcribe audio using OpenAI Whisper
            print(f"Transcribing audio file: {audio_file.filename}")
            
            with open(temp_file_path, "rb") as audio_file_obj:
                transcription_response = openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file_obj,
                    language="en"
                )
            
            raw_transcription = transcription_response.text
            print(f"Raw transcription: {raw_transcription[:100]}...")
            
            if not raw_transcription or raw_transcription.strip() == "":
                raise HTTPException(
                    status_code=400,
                    detail="Could not transcribe audio. Please check audio quality and try again."
                )
            
            # Step 2: Clean transcription and extract clinical context
            cleaned_transcription = clean_transcription(raw_transcription)
            clinical_context = extract_clinical_context(cleaned_transcription)
            print(f"Clinical context extracted: {clinical_context}")
            
            # Step 3: Generate department-specific medical report
            print(f"Generating medical report for {department} department...")
            
            department_guidance = get_department_prompt(department)
            
            medical_prompt = f"""You are a medical assistant specializing in {department}. Convert the following doctor-patient conversation into a formal medical report using clinical language.

Department Focus: {department_guidance}

Structure the report with these sections:
- Chief Complaint
- Patient History  
- Vital Signs (if mentioned)
- Clinical Observations
- Diagnosis
- Prescription
- Recommendations

Doctor-Patient Conversation:
{cleaned_transcription}

Clinical Context Detected:
- Vitals: {', '.join(clinical_context['vitals']) if clinical_context['vitals'] else 'None mentioned'}
- Symptoms: {', '.join(clinical_context['symptoms']) if clinical_context['symptoms'] else 'None specific'}
- Locations: {', '.join(clinical_context['locations']) if clinical_context['locations'] else 'None mentioned'}

Generate a comprehensive medical report:"""
            
            report_response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": f"You are a professional medical assistant specializing in {department} department. Focus on creating detailed, clinically accurate reports."},
                    {"role": "user", "content": medical_prompt}
                ],
                max_tokens=1200,
                temperature=0.3
            )
            
            clinical_report = report_response.choices[0].message.content
            print(f"Clinical report generated: {clinical_report[:100]}...")
            
            # Step 4: Generate AI summary for doctor
            print("Generating AI summary for doctor...")
            
            health_alerts = generate_health_alerts(clinical_context)
            
            summary_prompt = f"""Based on the medical report and clinical context, provide a concise summary for the doctor with key insights and recommendations.

Clinical Report:
{clinical_report}

Clinical Context:
- Department: {department}
- Vitals: {clinical_context['vitals']}
- Symptoms: {clinical_context['symptoms']}
- Patient Locations: {clinical_context['locations']}

Health Alerts: {health_alerts}

Provide a brief summary (2-3 sentences) with:
1. Key clinical findings
2. Recommended next steps
3. Any special alerts or considerations

Summary for Doctor:"""
            
            summary_response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an AI medical assistant providing concise clinical summaries for doctors."},
                    {"role": "user", "content": summary_prompt}
                ],
                max_tokens=200,
                temperature=0.2
            )
            
            ai_summary = summary_response.choices[0].message.content
            if health_alerts:
                ai_summary += f"\n\nHealth Alert: {health_alerts}"
            
            print(f"AI summary generated: {ai_summary[:100]}...")
            
            # Step 5: Save to Supabase reports table
            report_id = str(uuid.uuid4())
            created_at = datetime.utcnow()
            
            # Validate patient_id exists (convert to UUID format if needed)
            try:
                patient_uuid = uuid.UUID(patient_id)
                patient_id_value = str(patient_uuid)
            except ValueError:
                # If it's not a UUID, generate one based on the patient_id
                patient_id_value = str(uuid.uuid5(uuid.NAMESPACE_DNS, patient_id))
            
            result = supabase_admin.table('reports').insert({
                'id': report_id,
                'patient_id': patient_id_value,
                'department': department.lower(),
                'transcription': cleaned_transcription,
                'report': clinical_report,
                'summary': ai_summary,
                'created_at': created_at.isoformat()
            }).execute()
            
            if result.data:
                return ReportResponse(
                    id=report_id,
                    patient_id=patient_id_value,
                    department=department.lower(),
                    transcription=cleaned_transcription,
                    report=clinical_report,
                    summary=ai_summary,
                    created_at=created_at
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to save report to database"
                )
                
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing report: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing report: {str(e)}"
        )

@router.get("/list")
async def list_reports():
    """
    List all reports in the database
    """
    try:
        result = supabase_admin.table('reports').select('*').execute()
        return {"reports": result.data}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listing reports: {str(e)}"
        )

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: str):
    """
    Get a specific report by ID
    
    Args:
        report_id: UUID of the report
        
    Returns:
        ReportResponse: The requested report details
    """
    try:
        print(f"Fetching report with ID: {report_id}")
        
        # Query the specific report from Supabase
        response = supabase_admin.table('reports') \
            .select('id, patient_id, department, transcription, report, summary, created_at') \
            .eq('id', report_id) \
            .execute()
            
        print("Supabase response:", response.data)
            
        # Return 404 if report not found
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Report not found: {report_id}"
            )
            
        # Convert Supabase response to ReportResponse object
        try:
            report_data = response.data[0]
            report = ReportResponse(
                id=report_data['id'],
                patient_id=report_data['patient_id'],
                department=report_data['department'],
                transcription=report_data['transcription'],
                report=report_data['report'],
                summary=report_data['summary'],
                created_at=report_data['created_at']
            )
            print(f"Returning report {report_id}")
            return report
            
        except KeyError as ke:
            print(f"Error: Missing field in report data: {ke}")
            raise HTTPException(
                status_code=500,
                detail=f"Invalid report data structure: missing field {ke}"
            )
            
    except Exception as e:
        print(f"Error retrieving report: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving report: {str(e)}"
        )

@router.get("/{patient_id}/reports", response_model=list[ReportResponse])
async def get_patient_reports(patient_id: str):
    """
    Get all reports for a specific patient
    
    Args:
        patient_id: UUID of the patient
        
    Returns:
        List[ReportResponse]: List of all reports created for the patient, sorted by created_at descending
    """
    try:
        print(f"Fetching reports for patient_id: {patient_id}")
        
        # Query reports for the patient from Supabase
        response = supabase_admin.table('reports') \
            .select('id, patient_id, department, transcription, report, summary, created_at') \
            .eq('patient_id', patient_id) \
            .order('created_at', desc=True) \
            .execute()
            
        print("Supabase response:", response.data)
            
        # Return 404 if no reports found
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"No reports found for patient ID: {patient_id}"
            )
            
        # Convert Supabase response to ReportResponse objects
        reports = []
        for report_data in response.data:
            try:
                report = ReportResponse(
                    id=report_data['id'],
                    patient_id=report_data['patient_id'],
                    department=report_data['department'],
                    transcription=report_data['transcription'],
                    report=report_data['report'],
                    summary=report_data['summary'],
                    created_at=report_data['created_at']
                )
                reports.append(report)
            except KeyError as ke:
                print(f"Warning: Missing field in report data: {ke}")
                continue
            
        print(f"Returning {len(reports)} reports for patient {patient_id}")
        return reports
            
    except Exception as e:
        print(f"Error retrieving reports: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving reports: {str(e)}"
        ) 