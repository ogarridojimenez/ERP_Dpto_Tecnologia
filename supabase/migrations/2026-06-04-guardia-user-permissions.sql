-- Migracion: Agregar user_id para entrega y recibo en guardia_registros
-- Permite que cada tecnico solo pueda modificar su propia entrega/recibo

ALTER TABLE guardia_registros
ADD COLUMN IF NOT EXISTS entregado_por_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS recibido_por_user_id UUID REFERENCES auth.users(id);

-- Comentarios
COMMENT ON COLUMN guardia_registros.entregado_por_user_id IS 'User ID del tecnico que realizo la entrega';
COMMENT ON COLUMN guardia_registros.recibido_por_user_id IS 'User ID del tecnico que realizo el recibo';
