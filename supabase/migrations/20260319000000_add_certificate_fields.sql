-- Add missing fields to cursos table
ALTER TABLE cursos
ADD COLUMN IF NOT EXISTS horas INT,
ADD COLUMN IF NOT EXISTS tiene_certificado BOOLEAN DEFAULT true;

-- Add orden field to quizzes_preguntas if missing
ALTER TABLE quizzes_preguntas
ADD COLUMN IF NOT EXISTS orden INT DEFAULT 0;

-- Create lecciones_archivos table if it doesn't exist
CREATE TABLE IF NOT EXISTS lecciones_archivos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leccion_id UUID REFERENCES lecciones ON DELETE CASCADE NOT NULL,
  nombre_archivo TEXT NOT NULL,
  archivo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create certificate_downloads table if it doesn't exist
CREATE TABLE IF NOT EXISTS certificate_downloads (
  id UUID PRIMARY KEY,
  perfil_id UUID REFERENCES perfiles ON DELETE CASCADE NOT NULL,
  curso_id UUID REFERENCES cursos ON DELETE CASCADE NOT NULL,
  nombre_archivo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for new tables
ALTER TABLE lecciones_archivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_downloads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lecciones_archivos
CREATE POLICY "Lectura pública de archivos de lecciones" ON lecciones_archivos
  FOR SELECT USING (true);
CREATE POLICY "Solo admins pueden modificar archivos" ON lecciones_archivos
  FOR ALL USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));

-- RLS Policies for certificate_downloads
CREATE POLICY "Usuarios ven sus propios certificados" ON certificate_downloads
  FOR SELECT USING (auth.uid() = perfil_id);
CREATE POLICY "Admins acceden a todos los certificados" ON certificate_downloads
  FOR ALL USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));
