-- OneAI Medical Report Generator: Full SQL Schema (Cleaned)

-- Drop old/duplicate tables if they exist
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS uploaded_files;
DROP TABLE IF EXISTS consultations;
DROP TABLE IF EXISTS medications;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS tokens;
DROP TABLE IF EXISTS users;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tokens Table
CREATE TABLE IF NOT EXISTS tokens (
    id SERIAL PRIMARY KEY,
    token_code VARCHAR(8) NOT NULL,
    patient_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id)
);

-- 3. Reports Table (with PDF URL)
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    department VARCHAR(50) NOT NULL,
    transcription TEXT NOT NULL,
    report TEXT NOT NULL,
    summary TEXT NOT NULL,
    pdf_url TEXT, -- PDF download link
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (patient_id) REFERENCES users(id)
);

-- 4. Uploaded Files Table
CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    ai_summary TEXT,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (patient_id) REFERENCES users(id)
);

-- 5. Consultations Table
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    link TEXT NOT NULL,
    time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL, -- e.g., scheduled, completed, cancelled
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (doctor_id) REFERENCES users(id),
    FOREIGN KEY (patient_id) REFERENCES users(id)
);

-- 6. Medications Table
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    added_by TEXT, -- doctor or system
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (patient_id) REFERENCES users(id)
);

-- 7. Appointments Table
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