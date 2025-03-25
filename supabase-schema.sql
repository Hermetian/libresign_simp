-- Schema for LibreSign simplified application
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_path TEXT NOT NULL,
  
  -- Ensure status is one of the allowed values
  CONSTRAINT valid_status CHECK (status IN ('draft', 'sent', 'completed'))
);

-- Form Fields Table
CREATE TABLE IF NOT EXISTS form_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  field_type TEXT NOT NULL,
  x_position FLOAT NOT NULL,
  y_position FLOAT NOT NULL,
  width FLOAT NOT NULL,
  height FLOAT NOT NULL,
  page INTEGER NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure field_type is one of the allowed values
  CONSTRAINT valid_field_type CHECK (field_type IN ('signature', 'text', 'date'))
);

-- Signatures Table
CREATE TABLE IF NOT EXISTS signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_default BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS documents_created_by_idx ON documents(created_by);
CREATE INDEX IF NOT EXISTS form_fields_document_id_idx ON form_fields(document_id);
CREATE INDEX IF NOT EXISTS signatures_user_id_idx ON signatures(user_id);

-- Set up RLS (Row Level Security) policies

-- Documents RLS policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own documents
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = created_by);

-- Users can insert their own documents
CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own documents
CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = created_by);

-- Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  USING (auth.uid() = created_by);

-- Form Fields RLS policies
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;

-- Users can view form fields on documents they created
CREATE POLICY "Users can view form fields on their documents"
  ON form_fields FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = form_fields.document_id
    AND documents.created_by = auth.uid()
  ));

-- Users can insert form fields on documents they created
CREATE POLICY "Users can insert form fields on their documents"
  ON form_fields FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = form_fields.document_id
    AND documents.created_by = auth.uid()
  ));

-- Users can update form fields on documents they created
CREATE POLICY "Users can update form fields on their documents"
  ON form_fields FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = form_fields.document_id
    AND documents.created_by = auth.uid()
  ));

-- Users can delete form fields on documents they created
CREATE POLICY "Users can delete form fields on their documents"
  ON form_fields FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = form_fields.document_id
    AND documents.created_by = auth.uid()
  ));

-- Signatures RLS policies
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- Users can view their own signatures
CREATE POLICY "Users can view their own signatures"
  ON signatures FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own signatures
CREATE POLICY "Users can insert their own signatures"
  ON signatures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own signatures
CREATE POLICY "Users can update their own signatures"
  ON signatures FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own signatures
CREATE POLICY "Users can delete their own signatures"
  ON signatures FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage buckets (note: this usually needs to be done in the Supabase Dashboard)
-- These SQL comments are reminders for manual steps

-- 1. Create a 'documents' storage bucket with private access
-- 2. Create a 'signatures' storage bucket with private access

-- 3. Set up storage policies for documents bucket:
--    - Allow authenticated users to upload their own documents
--    - Allow authenticated users to read their own documents

-- 4. Set up storage policies for signatures bucket:
--    - Allow authenticated users to upload their own signatures
--    - Allow authenticated users to read their own signatures 