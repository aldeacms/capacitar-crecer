-- 1. Extensiones y TIPOS ENUM
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE tipo_acceso AS ENUM ('gratis', 'pago-inmediato', 'pago', 'gratis_cert_pago', 'cotizar');
CREATE TYPE tipo_leccion AS ENUM ('video', 'texto', 'quiz');
CREATE TYPE tipo_pregunta AS ENUM ('multiple', 'vf', 'abierta');

-- 2. TABLAS
-- Tabla de Perfiles (Extensión de auth.users)
CREATE TABLE perfiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  rut TEXT UNIQUE NOT NULL,
  nombre_completo TEXT NOT NULL,
  rol TEXT DEFAULT 'alumno' CHECK (rol IN ('admin', 'alumno')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Cursos
CREATE TABLE cursos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descripcion_breve TEXT,
  objetivos TEXT,
  metodologia TEXT,
  contenido_programatico TEXT,
  caracteristicas_generales TEXT,
  imagen_url TEXT,
  tipo_acceso tipo_acceso DEFAULT 'pago',
  precio_curso NUMERIC DEFAULT 0,
  precio_certificado NUMERIC DEFAULT 0,
  porcentaje_aprobacion INT DEFAULT 80,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Módulos
CREATE TABLE modulos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  curso_id UUID REFERENCES cursos ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  orden INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Lecciones
CREATE TABLE lecciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  modulo_id UUID REFERENCES modulos ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  contenido_html TEXT,
  video_url TEXT,
  orden INT NOT NULL,
  tipo tipo_leccion DEFAULT 'video',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Preguntas (Quizzes)
CREATE TABLE quizzes_preguntas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leccion_id UUID REFERENCES lecciones ON DELETE CASCADE NOT NULL,
  texto TEXT NOT NULL,
  tipo tipo_pregunta DEFAULT 'multiple',
  puntos INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Opciones (Quizzes)
CREATE TABLE quizzes_opciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pregunta_id UUID REFERENCES quizzes_preguntas ON DELETE CASCADE NOT NULL,
  texto TEXT NOT NULL,
  es_correcta BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Matrículas
CREATE TABLE matriculas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  perfil_id UUID REFERENCES perfiles ON DELETE CASCADE NOT NULL,
  curso_id UUID REFERENCES cursos ON DELETE CASCADE NOT NULL,
  estado_pago_curso BOOLEAN DEFAULT false,
  estado_pago_certificado BOOLEAN DEFAULT false,
  progreso_porcentaje INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(perfil_id, curso_id)
);

-- 3. SEGURIDAD (RLS)
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes_preguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes_opciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE matriculas ENABLE ROW LEVEL SECURITY;

-- Políticas para Perfiles
CREATE POLICY "Usuarios pueden ver su propio perfil" ON perfiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins pueden ver todos los perfiles" ON perfiles
  FOR SELECT USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));

-- Políticas para Catálogo (Cursos, Modulos, Lecciones, Quizzes)
-- Lectura pública
CREATE POLICY "Lectura pública de cursos" ON cursos FOR SELECT USING (true);
CREATE POLICY "Lectura pública de modulos" ON modulos FOR SELECT USING (true);
CREATE POLICY "Lectura pública de lecciones" ON lecciones FOR SELECT USING (true);
CREATE POLICY "Lectura pública de preguntas" ON quizzes_preguntas FOR SELECT USING (true);
CREATE POLICY "Lectura pública de opciones" ON quizzes_opciones FOR SELECT USING (true);

-- Solo Admins pueden CUD (Create, Update, Delete)
CREATE POLICY "Solo admins pueden modificar cursos" ON cursos
  FOR ALL USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));
CREATE POLICY "Solo admins pueden modificar modulos" ON modulos
  FOR ALL USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));
CREATE POLICY "Solo admins pueden modificar lecciones" ON lecciones
  FOR ALL USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));
CREATE POLICY "Solo admins pueden modificar preguntas" ON quizzes_preguntas
  FOR ALL USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));
CREATE POLICY "Solo admins pueden modificar opciones" ON quizzes_opciones
  FOR ALL USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));

-- Políticas para Matrículas
CREATE POLICY "Usuarios ven sus propias matriculas" ON matriculas
  FOR SELECT USING (auth.uid() = perfil_id);
CREATE POLICY "Usuarios actualizan su propio progreso" ON matriculas
  FOR UPDATE USING (auth.uid() = perfil_id);
CREATE POLICY "Admins gestionan todas las matriculas" ON matriculas
  FOR ALL USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));
