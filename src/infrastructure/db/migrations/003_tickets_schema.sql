-- 1. Tabla de Departamentos (Catálogo centralizado)
CREATE TABLE IF NOT EXISTS departamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL UNIQUE, -- Ej. Sistemas, Recursos Humanos, Mantenimiento
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla principal de Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  prioridad VARCHAR(50) NOT NULL, -- Ej: Baja, Media, Alta, Critica
  estado VARCHAR(50) NOT NULL DEFAULT 'Abierto', -- Ej: Abierto, En Progreso, Resuelto, Cerrado
  id_departamento UUID NOT NULL REFERENCES departamentos(id), -- Relación al departamento asignado
  id_creador UUID NOT NULL REFERENCES personas(id),
  id_asignado UUID REFERENCES personas(id),
  
  -- Campos para Resolución y Cierre
  notas_resolucion TEXT,
  fecha_resolucion TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla para adjuntar evidencia fotográfica
CREATE TABLE IF NOT EXISTS ticket_evidencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_ticket UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  url_archivo TEXT NOT NULL,
  formato VARCHAR(50), 
  tamano_bytes BIGINT, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de historial de estados para auditoría y seguimiento
CREATE TABLE IF NOT EXISTS ticket_historial_estados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_ticket UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  id_usuario UUID NOT NULL REFERENCES personas(id),
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50) NOT NULL,
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Función y Trigger para mantener actualizado automáticamente el 'updated_at' de la tabla tickets
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;

CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
