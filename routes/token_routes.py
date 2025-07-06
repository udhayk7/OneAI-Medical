from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
import random
import string
import uuid
from config import supabase_admin
from models import TokenGenerateRequest, TokenResponse, ErrorResponse

router = APIRouter(prefix="/api/tokens", tags=["tokens"])

def generate_token_code(length: int = 8) -> str:
    """Generate a random 8-character token code"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

@router.post("/generate-token", response_model=TokenResponse)
async def generate_token(request: TokenGenerateRequest):
    """
    Generate a token for a patient
    
    Args:
        request: TokenGenerateRequest containing patient_id
        
    Returns:
        TokenResponse: Generated token information
    """
    try:
        # Generate unique token code
        token_code = generate_token_code()
        
        # Set expiration time (optional - 24 hours from now)
        created_at = datetime.utcnow()
        expires_at = created_at + timedelta(hours=24)
        
        # Insert token into Supabase
        # Try to convert patient_id to UUID if it's not already
        try:
            patient_uuid = uuid.UUID(request.patient_id)
            patient_id_value = str(patient_uuid)
        except ValueError:
            # If it's not a UUID, generate one based on the patient_id
            patient_id_value = str(uuid.uuid5(uuid.NAMESPACE_DNS, request.patient_id))
        
        result = supabase_admin.table('tokens').insert({
            'token_code': token_code,
            'patient_id': patient_id_value,
            'created_at': created_at.isoformat(),
            'expires_at': expires_at.isoformat()
        }).execute()
        
        if result.data:
            return TokenResponse(
                token_code=token_code,
                patient_id=patient_id_value,
                created_at=created_at,
                expires_at=expires_at
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to create token"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating token: {str(e)}"
        ) 