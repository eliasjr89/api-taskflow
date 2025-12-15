-- Añadir columna profile_image a la tabla users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Añadir comentario a la columna
COMMENT ON COLUMN users.profile_image IS 'URL de la imagen de perfil del usuario';
