-- Esquema relacional estandarizado para el Modulo de Incidencias (Tickets)
-- Referencia de arquitectura: HU-04, HU-05, HU-06

-- 1. Tabla de Personas (Usuarios del sistema de negocio vinculados a Supabase Auth)
CREATE TABLE IF NOT EXISTS public.personas (
  id UUID NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido_pat VARCHAR(100) NOT NULL,
  apellido_mat VARCHAR(100),
  tel VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT personas_pkey PRIMARY KEY (id),
  CONSTRAINT personas_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- 2. Catalogo de Roles
CREATE TABLE IF NOT EXISTS public.roles (
  id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
  descripcion VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);

-- 3. Tabla intermedia de Roles por Persona
CREATE TABLE IF NOT EXISTS public.roles_personas (
  id_persona UUID NOT NULL,
  id_rol BIGINT NOT NULL,
  CONSTRAINT roles_personas_pkey PRIMARY KEY (id_persona, id_rol),
  CONSTRAINT fk_roles_personas_persona FOREIGN KEY (id_persona) REFERENCES public.personas(id),
  CONSTRAINT fk_roles_personas_rol FOREIGN KEY (id_rol) REFERENCES public.roles(id)
);

-- 4. Catalogo de Departamentos
CREATE TABLE IF NOT EXISTS public.departamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT departamentos_pkey PRIMARY KEY (id)
);

-- 5. Tabla Principal de Tickets
-- Almacena la informacion central de cada incidencia reportada
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  prioridad VARCHAR(50) NOT NULL, -- Baja, Media, Alta, Critica
  estado VARCHAR(50) NOT NULL DEFAULT 'Abierto', -- Abierto, En revision, En progreso, Resuelto, Cerrado
  id_creador UUID NOT NULL,
  id_asignado UUID,
  notas_resolucion TEXT,
  fecha_resolucion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  id_departamento UUID NOT NULL,
  CONSTRAINT tickets_pkey PRIMARY KEY (id),
  CONSTRAINT tickets_id_creador_fkey FOREIGN KEY (id_creador) REFERENCES public.personas(id),
  CONSTRAINT tickets_id_asignado_fkey FOREIGN KEY (id_asignado) REFERENCES public.personas(id),
  CONSTRAINT tickets_id_departamento_fkey FOREIGN KEY (id_departamento) REFERENCES public.departamentos(id)
);

-- 6. Tabla de Evidencias Fotograficas y Archivos Adjuntos (HU-04)
CREATE TABLE IF NOT EXISTS public.ticket_evidencias (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  id_ticket UUID NOT NULL,
  url_archivo TEXT NOT NULL,
  formato VARCHAR(50),
  tamano_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT ticket_evidencias_pkey PRIMARY KEY (id),
  CONSTRAINT ticket_evidencias_id_ticket_fkey FOREIGN KEY (id_ticket) REFERENCES public.tickets(id) ON DELETE CASCADE
);

-- 7. Tabla de Historial de Estados para Auditoria y Trazabilidad (HU-05)
CREATE TABLE IF NOT EXISTS public.ticket_historial_estados (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  id_ticket UUID NOT NULL,
  id_usuario UUID NOT NULL,
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50) NOT NULL,
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT ticket_historial_estados_pkey PRIMARY KEY (id),
  CONSTRAINT ticket_historial_estados_id_ticket_fkey FOREIGN KEY (id_ticket) REFERENCES public.tickets(id) ON DELETE CASCADE,
  CONSTRAINT ticket_historial_estados_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.personas(id)
);

-- Trigger para mantener actualizado automaticamente el campo updated_at de tickets
CREATE OR REPLACE FUNCTION update_tickets_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_tickets_updated_at ON public.tickets;

CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION update_tickets_updated_at_column();
