-- Drop old/duplicate tables if they exist
DROP TABLE IF EXISTS doctor_profiles;
DROP TABLE IF EXISTS patient_profiles;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS uploaded_files;
DROP TABLE IF EXISTS consultations;
DROP TABLE IF EXISTS medications;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS tokens;
DROP TABLE IF EXISTS users;

-- 1. Users Table (auth + common fields)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    phone VARCHAR,
    password TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('doctor', 'patient')) NOT NULL DEFAULT 'patient',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Doctor Profiles Table (extended doctor info)
CREATE TABLE IF NOT EXISTS doctor_profiles (
    user_id UUID PRIMARY KEY,
    specialization TEXT,
    experience_years INT,
    qualifications TEXT,
    hospital_name TEXT,
    available_from TIME,
    available_to TIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Patient Profiles Table (optional extended patient info)
CREATE TABLE IF NOT EXISTS patient_profiles (
    user_id UUID PRIMARY KEY,
    gender TEXT,
    date_of_birth DATE,
    blood_group TEXT,
    address TEXT,
    known_conditions TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Tokens Table (for temporary data access by doctors)
CREATE TABLE IF NOT EXISTS tokens (
    id SERIAL PRIMARY KEY,
    token_code VARCHAR(8) NOT NULL UNIQUE,
    patient_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id)
);

-- 5. Reports Table (with PDF URL for download)
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    department VARCHAR(50) NOT NULL,
    transcription TEXT NOT NULL,
    report TEXT NOT NULL,
    summary TEXT NOT NULL,
    pdf_url TEXT, -- optional downloadable file
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (patient_id) REFERENCES users(id)
);

-- 6. Uploaded Files Table (patient uploads)
CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    ai_summary TEXT,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (patient_id) REFERENCES users(id)
);

-- 7. Consultations Table (virtual consult links)
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    link TEXT NOT NULL,
    time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL, -- scheduled, completed, cancelled
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (doctor_id) REFERENCES users(id),
    FOREIGN KEY (patient_id) REFERENCES users(id)
);

-- 8. Medications Table (doctor-prescribed or system-added)
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    added_by TEXT, -- doctor/system
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (patient_id) REFERENCES users(id)
);

-- 9. Appointments Table (Twilio-integrated, status-driven)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    department VARCHAR(50) NOT NULL,
    appointment_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL, -- scheduled, confirmed, cancelled, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (doctor_id) REFERENCES users(id)
); 