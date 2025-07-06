from fastapi import APIRouter, HTTPException
from datetime import datetime
import uuid
from config import supabase_admin
from pydantic import BaseModel

router = APIRouter(prefix="/api/users", tags=["users"])

class UserCreateRequest(BaseModel):
    name: str
    email: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime

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