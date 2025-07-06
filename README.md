# OneAI Medical Report Generator

A modern web application for generating AI-powered medical reports from audio recordings.

## Features

- Upload audio recordings of doctor-patient conversations
- Automatic transcription using OpenAI Whisper
- AI-generated medical reports with department-specific context
- Clean and modern UI with Tailwind CSS
- Real-time form validation and error handling
- Responsive design for all devices

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The frontend will be available at http://localhost:3000

## Project Structure

- `/src/components/` - React components
- `/src/main.tsx` - Application entry point
- `/src/index.css` - Global styles and Tailwind imports

## Dependencies

- React 18
- Tailwind CSS
- Headless UI
- TypeScript
- Vite

## Development

The project uses:
- TypeScript for type safety
- Tailwind CSS for styling
- Vite for fast development and building
- ESLint for code quality
- Prettier for code formatting

## API Integration

The frontend expects a FastAPI backend running on http://localhost:8000 with the following endpoint:

- POST `/api/reports/add` - Upload audio and generate report
  - Accepts multipart/form-data with:
    - patient_id (UUID)
    - doctor_id (UUID)
    - department (string)
    - audio_file (file)

# OneAI Backend API

FastAPI backend application with Supabase integration for token management.

## Project Structure

```
oneai/
├── main.py                 # FastAPI application entry point
├── config.py              # Supabase client configuration
├── models.py              # Pydantic models
├── routes/
│   ├── __init__.py
│   └── token_routes.py    # Token generation routes
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Create environment file**:
   Create a `.env` file in the project root with the following variables:
   ```
   SUPABASE_URL=https://splrdvpkhvdkqouduxje.supabase.co
   SUPABASE_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Supabase Setup**:
   Make sure your Supabase project has the following tables:
   - `users`
   - `tokens`
   - `reports`
   - `appointments`
   - `uploaded_files`

   Required table structures:
   
   **Users table:**
   ```sql
   CREATE TABLE users (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name VARCHAR NOT NULL,
       email VARCHAR NOT NULL UNIQUE,
       created_at TIMESTAMP DEFAULT NOW()
   );
   ```
   
   **Tokens table:**
   ```sql
   CREATE TABLE tokens (
       id SERIAL PRIMARY KEY,
       token_code VARCHAR(8) NOT NULL,
       patient_id UUID NOT NULL,
       created_at TIMESTAMP DEFAULT NOW(),
       expires_at TIMESTAMP,
       FOREIGN KEY (patient_id) REFERENCES users(id)
   );
   ```
   
   **Reports table:**
   ```sql
   CREATE TABLE reports (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       patient_id UUID NOT NULL,
       department VARCHAR(50) NOT NULL,
       transcription TEXT NOT NULL,
       report TEXT NOT NULL,
       summary TEXT NOT NULL,
       created_at TIMESTAMP DEFAULT NOW(),
       FOREIGN KEY (patient_id) REFERENCES users(id)
   );
   ```

## Running the Application

```bash
# Using Python directly
python main.py

# Or using uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- Interactive API docs: `http://localhost:8000/docs`
- ReDoc documentation: `http://localhost:8000/redoc`

## API Endpoints

### 🎙️ Enhanced Medical Report Generation
- **POST** `/api/reports/add`
- **Description**: AI-powered clinical voice-to-report generation with department-specific processing
- **Request**: Multipart form data
  - `patient_id`: UUID of existing patient
  - `department`: Medical department (general, cardiology, ent, neurology, orthopedics, pediatrics, dermatology)
  - `audio_file`: Doctor-patient conversation audio file (webm, wav, mp3, m4a)
- **Response**:
  ```json
  {
    "id": "uuid",
    "patient_id": "uuid",
    "department": "cardiology",
    "transcription": "Cleaned doctor-patient conversation...",
    "report": "Department-specific formatted medical report...",
    "summary": "AI-generated summary with key insights and health alerts...",
    "created_at": "2023-01-01T12:00:00Z"
  }
  ```

- **GET** `/api/reports/list`
- **Description**: List all medical reports
- **Response**:
  ```json
  {
    "reports": [...]
  }
  ```

- **GET** `/api/reports/{report_id}`
- **Description**: Get specific report by ID

### 👥 User Management
- **POST** `/api/users/create-user`
- **Description**: Create a new user/patient
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com"
  }
  ```
- **Response**:
  ```json
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2023-01-01T12:00:00Z"
  }
  ```

- **GET** `/api/users/list-users`
- **Description**: List all users

### 🔑 Token Management
- **POST** `/api/tokens/generate-token`
- **Description**: Generate a new token for a patient
- **Request Body**:
  ```json
  {
    "patient_id": "uuid"
  }
  ```
- **Response**:
  ```json
  {
    "token_code": "ABC12345",
    "patient_id": "uuid",
    "created_at": "2023-01-01T12:00:00Z",
    "expires_at": "2023-01-02T12:00:00Z"
  }
  ```

### 🏥 Health Check
- **GET** `/health`
- **Description**: Check if the API is running
- **Response**:
  ```json
  {
    "status": "healthy"
  }
  ```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (for admin operations) |
| `OPENAI_API_KEY` | Your OpenAI API key for Whisper and GPT-3.5 |

## Dependencies

- `fastapi` - Modern web framework for building APIs
- `uvicorn` - ASGI server for running the application
- `supabase` - Python client for Supabase
- `python-dotenv` - Load environment variables from .env file
- `pydantic` - Data validation and settings management
- `openai` - OpenAI API client for Whisper and GPT-3.5
- `python-multipart` - File upload handling
- `aiofiles` - Async file operations 