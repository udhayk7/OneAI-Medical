import os
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI

# Load environment variables
load_dotenv()

# Environment variables - You need to create a .env file with these values:
# SUPABASE_URL=https://splrdvpkhvdkqouduxje.supabase.co
# SUPABASE_KEY=your_supabase_anon_key_here
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
# OPENAI_API_KEY=your_openai_api_key_here

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Validate environment variables
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials missing! Make sure SUPABASE_URL and SUPABASE_KEY are set in .env file")

if not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("SUPABASE_SERVICE_ROLE_KEY missing! Make sure it's set in .env file")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY missing! Make sure it's set in .env file")

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Create service role client for admin operations
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Create OpenAI client
openai_client = OpenAI(api_key=OPENAI_API_KEY) 