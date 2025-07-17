from fastapi import APIRouter, HTTPException
from datetime import datetime
import uuid
from config import supabase_admin
from pydantic import BaseModel
import bcrypt
import os
import jwt
from fastapi import Depends

router = APIRouter(prefix="/api/users", tags=["users"])

class UserCreateRequest(BaseModel):
    name: str
    email: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime

class DoctorRegisterRequest(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    specialization: str = ""
    experience_years: int = 0
    qualifications: str = ""
    hospital_name: str = ""
    available_from: str = None  # e.g., "09:00"
    available_to: str = None    # e.g., "17:00"

class DoctorRegisterResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str
    created_at: datetime
    profile_created: bool

class DoctorLoginRequest(BaseModel):
    email: str
    password: str

class DoctorLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    email: str
    role: str

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"

@router.post("/create-user", response_model=UserResponse)
async def create_user(request: UserCreateRequest):
    """
    Create a new user in the database
    
    Args:
        request: UserCreateRequest containing name and email
        
    Returns:
        UserResponse: Created user information
    """
    try:
        # Generate a UUID for the user
        user_id = str(uuid.uuid4())
        created_at = datetime.utcnow()
        
        # Insert user into Supabase
        result = supabase_admin.table('users').insert({
            'id': user_id,
            'name': request.name,
            'email': request.email,
            'created_at': created_at.isoformat()
        }).execute()
        
        if result.data:
            return UserResponse(
                id=user_id,
                name=request.name,
                email=request.email,
                created_at=created_at
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to create user"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating user: {str(e)}"
        )

@router.post("/register-doctor", response_model=DoctorRegisterResponse)
async def register_doctor(request: DoctorRegisterRequest):
    """
    Register a new doctor (user + doctor_profiles)
    """
    try:
        # Check if email already exists
        existing = supabase_admin.table('users').select('id').eq('email', request.email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Email already registered")
        # Hash password
        hashed_pw = bcrypt.hashpw(request.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user_id = str(uuid.uuid4())
        created_at = datetime.utcnow()
        # Insert into users
        user_result = supabase_admin.table('users').insert({
            'id': user_id,
            'name': request.name,
            'email': request.email,
            'phone': request.phone,
            'password': hashed_pw,
            'role': 'doctor',
            'created_at': created_at.isoformat()
        }).execute()
        # Insert into doctor_profiles
        profile_result = supabase_admin.table('doctor_profiles').insert({
            'user_id': user_id,
            'specialization': request.specialization,
            'experience_years': request.experience_years,
            'qualifications': request.qualifications,
            'hospital_name': request.hospital_name,
            'available_from': request.available_from,
            'available_to': request.available_to
        }).execute()
        return DoctorRegisterResponse(
            id=user_id,
            name=request.name,
            email=request.email,
            phone=request.phone,
            role='doctor',
            created_at=created_at,
            profile_created=True
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error registering doctor: {str(e)}")

@router.post("/login-doctor", response_model=DoctorLoginResponse)
async def login_doctor(request: DoctorLoginRequest):
    """
    Doctor login endpoint. Verifies email and password, returns JWT on success.
    """
    try:
        # Fetch user by email
        result = supabase_admin.table('users').select('*').eq('email', request.email).eq('role', 'doctor').execute()
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        user = result.data[0]
        # Check password
        if not bcrypt.checkpw(request.password.encode('utf-8'), user['password'].encode('utf-8')):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        # Generate JWT
        payload = {
            "sub": user['id'],
            "email": user['email'],
            "role": user['role'],
            "name": user['name']
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        return DoctorLoginResponse(
            access_token=token,
            user_id=user['id'],
            name=user['name'],
            email=user['email'],
            role=user['role']
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error logging in: {str(e)}")

@router.get("/list-users")
async def list_users():
    """
    List all users in the database
    """
    try:
        result = supabase_admin.table('users').select('*').execute()
        return {"users": result.data}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listing users: {str(e)}"
        ) 