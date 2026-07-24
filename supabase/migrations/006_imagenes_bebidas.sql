-- =====================================================================
-- Smash Bros Burger — Imágenes de las bebidas sin foto
--
-- 'Limonada de la Casa' y 'Refresco Artesano' se crearon sin imagen
-- porque los mockups del diseño no incluían fotos de bebidas sin
-- alcohol. Se asignan dos fotos libres de Unsplash (sin marcas
-- comerciales visibles) para que la carta no tenga huecos.
--
-- Ambas se pueden sustituir desde el panel de administración subiendo
-- las fotos reales del restaurante.
-- =====================================================================

update public.platos
set imagen_url = 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&q=80'
where nombre = 'Limonada de la Casa'
  and imagen_url is null;

update public.platos
set imagen_url = 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80'
where nombre = 'Refresco Artesano'
  and imagen_url is null;
