-- =====================================================================
-- Javi's — Datos iniciales
-- Secciones, franjas horarias y platos tomados de los mockups.
-- Es idempotente: se puede ejecutar varias veces sin duplicar.
-- =====================================================================

-- ---------------------------------------------------------------------
-- SECCIONES
-- ---------------------------------------------------------------------
insert into public.secciones (nombre, slug, orden) values
  ('Entradas', 'entradas', 1),
  ('Hamburguesas', 'hamburguesas', 2),
  ('Pollo Broster', 'pollo-broster', 3),
  ('Papas Fritas', 'papas-fritas', 4),
  ('Postres', 'postres', 5),
  ('Bebidas', 'bebidas', 6)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- FRANJAS HORARIAS
-- Horario continuo de 16:00 a 23:30, cada media hora. El campo 'turno'
-- se conserva por compatibilidad de esquema, pero la carta ya no agrupa
-- las franjas por turno.
-- ---------------------------------------------------------------------
insert into public.franjas_horarias (hora, turno) values
  ('16:00', 'comida'),
  ('16:30', 'comida'),
  ('17:00', 'cena'),
  ('17:30', 'cena'),
  ('18:00', 'cena'),
  ('18:30', 'cena'),
  ('19:00', 'cena'),
  ('19:30', 'cena'),
  ('20:00', 'cena'),
  ('20:30', 'cena'),
  ('21:00', 'cena'),
  ('21:30', 'cena'),
  ('22:00', 'cena'),
  ('22:30', 'cena'),
  ('23:00', 'cena'),
  ('23:30', 'cena')
on conflict (hora) do nothing;

-- ---------------------------------------------------------------------
-- PLATOS
-- Las imágenes son las de los mockups del diseño. Se pueden sustituir
-- desde el panel de administración subiendo ficheros propios.
-- ---------------------------------------------------------------------
insert into public.platos
  (seccion_id, nombre, descripcion, precio, etiqueta, destacado, orden, imagen_url)
select s.id, v.nombre, v.descripcion, v.precio, v.etiqueta, v.destacado, v.orden, v.imagen_url
from (values
  -- ---------------------------- ENTRADAS ----------------------------
  ('entradas', 'Nachos de la Casa',
   'Totopos de maíz crujientes con queso fundido, jalapeños, pico de gallo y guacamole.',
   7.50, 'Popular', false, 1,
   'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=800&q=80'),

  ('entradas', 'Alitas BBQ',
   'Alitas de pollo glaseadas en salsa barbacoa, acompañadas de salsa ranch.',
   8.90, null, false, 2,
   'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=800&q=80'),

  ('entradas', 'Aros de Cebolla',
   'Aros de cebolla rebozados y fritos, crujientes por fuera y tiernos por dentro.',
   5.50, null, false, 3,
   'https://images.unsplash.com/photo-1639024471283-03518883512d?w=800&q=80'),

  -- -------------------------- HAMBURGUESAS --------------------------
  ('hamburguesas', 'Double OG Smash',
   '2 patties de 100g, doble queso americano, pepinillos, cebolla picada y mostaza en pan brioche artesano.',
   12.90, 'Best Seller', true, 1,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuDV5_fa8chW8jyXAwdbUTkWK-OEt0R-S0_C9nxoEscOyyBCV1hUy-sgO4SeAetV0M7-BUnFTEumZJD_cDdDaX_AfU6S87OVh8zBFt_7iJ3YfBx_1K3PYTIaHRTMYfSOx_NN1Y4ESHj527WaRFR991gQNBO0lTgQVE-v5ZmKd2tAw5VzRMLDSdaqlYUj8Nt8B0a1aMlKHHAwvHRMZYrxaxddaVIquUTG2FG3OzEJMO2r14klxFLOPArDRarmFfXfaEkMa_7gZqRcRMdG'),

  ('hamburguesas', 'The Inferno Smash',
   'Tres carnes, jalapeños frescos, queso pepper jack y nuestra salsa picante Inferno. No apta para cobardes.',
   14.50, 'Picante', true, 2,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuB1daCMXAKtHYFI10YxIE7Mxcu_nmlcZiHzLLAE35O1ruLnI34chJkYg769GDDGbjIvNaiJn_AcgGeRwhSCrNwOV9GS4NyQTZe6F0Bi0QCDodZVH4XuXQEEikyngQFKmNOJEHQScaeHhHn-c2Que1VtSqUc3IPPDcPANBsYL5CYYxhEIMANKcHxZ-ebrk0TSxcYLrNz46uNI174Dtw5OOkiUNp9gFGCm1wQ4GDs9WlBtxXcnGzqXnGSfWKzqG4xJh3o1yszkxkjWRfV'),

  ('hamburguesas', 'Truffle King',
   'Carne Angus, crema de trufa negra, cebolla caramelizada y queso suizo.',
   16.00, null, true, 3,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuAwDRk_Lk6zeVkLXYSGAfoBqNJhsLaKmmyRypjVs6t0HN5WRG6z1yNSGknBYCO22-ViGxOIOn5yI7D1qn_LbVvM1yDNME9ht0FUZTsubUCSBA6VUkCeEwGGSqKjq1bhe38nrwHg82lT05sRjgP_Bz9x5UsbggNhOEZ8huE5SZCllmCqcI1Qvg8VjCUTg_fdAQ6WSItvISD2_QfteCbtQfKPj9G7hxbJWEfevgvnW7pMlwREOSd0UPGFa9rZp9_GEZhZFP_MXnsh_MkM'),

  ('hamburguesas', 'Green Power Smash',
   'Beyond Meat smashed, queso vegano, aguacate, brotes frescos y salsa alioli de soja.',
   13.20, 'Vegano', false, 4,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuDIgSv-yXSGLBMkx_HYegey4u4PQi4d6w3X9KzfBHzPqQSVlKRkjpBuQqlb113CouCnjeXSgFMjgQS-yYKO9putVr6CgLpp62g4LK8ZrzgTK2W1HXu5QOEtvZLG9MDbVNWrJKhIoLmlL_wUe7ATRHLLCKwpzwUecfnK9tDxMSvfRvYbie99lSkM43uKh3lbHzzRB9swQN8tOtq3dofrziICdfpCkjpHeVOFx6JccmbW5TTu8K-iMEZWQ2WpOyTMokgOPOVPSkAPNZsl'),

  ('hamburguesas', 'Classic Smash',
   'Doble carne madurada, queso americano, cebolla, mostaza y pepinillos. La esencia.',
   12.00, null, false, 5,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuAHQLy2ZJl20M0pPlF_LtI1IqSVH4dYkArbgFeRS_S_WaBK-NLkJu_Kth0Q6Mb3LGCxNcLH8PEhND31P5VAHimIE6bArauek_q3-Qxxt84GKT6g6qc07wsgoKxAAMy5dgGjgi8oeovWT6MOuxgVerfOIMZq7nLpUaLo95MpbdDdQ_oPJhzJ6dSly6yhNNi8zRuzx6n8fcchRjC3RUCwIaZxHB9X1tGj9GbwzwWfnRj4zpeshd6uo_owyHNHrpo82WtvS3mHSDp1YwwW'),

  ('hamburguesas', 'Inferno Bros',
   'Triple smash, jalapeños frescos, salsa sriracha-mayo y bacon crujiente.',
   14.00, 'Picante', false, 6,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuAbZcfAzNLyAWO5CM13fLz53S0TNR4XJxSuiRlFKx9wGJ4Z0aQOGsv7IWy2uSjGBTS4Oba9TPyHAatj6h3BgLdhUjlgQefSFlL9fnxm32hN2a8NMDrTrhBg-c02eqi_9v2VoSJq0iY0yq--vATiK30XUMNT0BWclo0sEo5dtuUK84HW7Pqe6k0X9jeGoPjcOOPPGnaZMT1hbk6jznHsQ1je27tkjuQiKKIqdKcGk522OZfLyP6PLgfLAOXg148bCg5oikVHVgpDIXJh'),

  ('hamburguesas', 'The OG Smash',
   'Doble carne de 120g, queso cheddar y pepinillo encurtido de la casa.',
   12.50, null, false, 7,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuDVvpW_gIVkqKiwNLAkU_N-zSifUp_ueYQshQij9CqHU4lswLkllPaRBG9NKLw-8AjjYZdJO-gh3N3FlmeacPFuqcAe9ZGgPwzyvJUP6A01OGqbltkfWrBdSoh1qu9jOiFGknBystVOC7V0idL_T1UdeNdfcov0ir_dcxyJEoGzIYeqhfeccx-2xp5bNceo9AOv4Vw_nK9HRgM-wHgXJyOjJXyfHLhhQ_c4aYkyK1o3z_KtwWnHSe8Ih2SPMb3QnZoWit2ECum-hHbs'),

  -- ------------------------- POLLO BROSTER ---------------------------
  ('pollo-broster', 'Broster Clásico',
   'Piezas de pollo marinadas 24 horas y fritas con nuestra receta de especias secretas, doradas y crujientes.',
   9.90, 'Best Seller', true, 1,
   'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80'),

  ('pollo-broster', 'Broster Picante',
   'Pollo broster bañado en salsa picante de la casa, con un toque ahumado.',
   10.50, 'Picante', true, 2,
   'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80'),

  ('pollo-broster', 'Combo Broster Familiar',
   '8 piezas de pollo broster para compartir, acompañadas de salsas de la casa.',
   22.00, null, false, 3,
   'https://images.unsplash.com/photo-1569058242567-93de6f36f8e6?w=800&q=80'),

  -- -------------------------- PAPAS FRITAS ---------------------------
  ('papas-fritas', 'Papas Clásicas',
   'Papas fritas caseras cortadas a mano, doradas y crujientes, con nuestro sazón de la casa.',
   4.50, 'Popular', true, 1,
   'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=800&q=80'),

  ('papas-fritas', 'Papas con Queso y Bacon',
   'Papas fritas cubiertas con queso fundido, bacon crujiente y cebollino.',
   6.90, null, false, 2,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuCjC-5-HGl-r02YYUujbIHxLK5CzXKeUj3XFppnwnqN4ts3kfzyr_vJ4BPojUN-cGzTfDE1dfVq3POeWHL8bSI0E4-Dr6Q-UvOn-n6ffRmB57rPIUHbP1Tpah_b1H-K5pVPQ7osDz-Vlkp4IR3p4-3ihxVihHQohtTBLWUGovxTUcwQLNIsWj1gGTpGpKSfCE3VVoTYx_DLWh4DGuQW8p3HHoPXTeYb_oFBiBd-7jvSGqkod7NbgTR4lydsJR6TqOd8LMWEH0i2lIEA'),

  ('papas-fritas', 'Papas Trufadas',
   'Papas caseras cortadas a mano, aceite de trufa y parmesano recién rallado.',
   6.90, null, false, 3,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuD6d_39szbHGA15f7-UB_Aiwlk65-RhAMmaP5KlwV1E5vIvHcxe1BY2m6TppNFb-6DM-6swn4PxmCXvSS6bj0yD0T2iFAgYyfFQXoDbksSikO1IXOcfd2PTNTHFcapLXBfMb17573mo2hi6RrpBsL-DBHgzrHue_lWDkkDSHdXBp5Z1kS8Tyx60nDwBYo2MtkY-O1rgv2fZEfdgBRsyFoDJ5B5WXQlwV2Pu3M5WblKaN2Vn2zWqDuOPYtvWlStdfHV8vJNlOvFCWJaZ'),

  ('papas-fritas', 'Papas Brutal',
   'Papas cortadas a mano, doble fritura y nuestro sazón secreto de la casa.',
   6.00, null, false, 4,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuDQq5KrEbVRP7Efech8kM3mbF0ivzFDU1etCDv8JQ6JTYZu_l9Q57yiWLqPYiKy_A0okgZ1B_0I5XImN2toUQPQKS1-3OxqcegiJETWTlQK-ZJMVat0dEfEjGBKM2DyHYVAQKpdPEjSXL3I8BNI5Sm2Ti-F-uQB7XTUn02XugOuvXM9YouUS8kbVTMPPawO1ZDjt1q6XrTZO8FIMQgpgtBzn0uqrAPI2GVH9QsZ_LII6hXXwmP251otRjQG8k2WRMjT4CjI9g0tRy5b'),

  -- ---------------------------- POSTRES -----------------------------
  ('postres', 'Lava Smash Cake',
   'Coulant de chocolate negro 70% con corazón fundente, acompañado de helado de vainilla de Madagascar.',
   7.00, null, false, 1,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuDbJu-GFsIDLqjNxqWmz6uI47o5-Jmj72Inymh_K-V98gNaZs1HzVtX5Qx7ZyJOEWJMenhZVEY2LCrMqjrjIm6JazJDsptnucGLgOpBO849593KruyU5NLfRcNiivs8wFS_3Vbhf6yuthX-MeiEQWBGbJHgrt09A14sYClHCDwnsB5Hp3_I5b3lHjLcW8IN1AeOnUu7b-Vb4GsgqaQP2zI_HDJXORw89to4sfceJUmqvRUfEPxVfLk0O37fA4UQ1RKfRdSzh0wxowo9'),

  ('postres', 'Nutella Blast',
   'Batido de avellana con nata montada y trozos de brownie.',
   5.50, null, false, 2,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuCmg-lfQkgVlQISrNUo0Nhu00lTTx7ye3luOATCz1BOE9YzcB9IFUjYwfmlFqpowYOZ2q8zY2DfwBz_cZtce0RiR_BXtgy6CeSdsBuQBjXzaprLAdhnlszkVd0sPZH8GoJxpFvZyEXDaU7jrdMmnjcZiLRzpzY3UUo0du_if26vPgMuoNZKqwZ-yxgMiQXwYRQ9iBNQVrQYuo5KQ7yj5RGqNyOPmHcGKlS19we49mIK35_Pr7iNurLMEs5lbs9S9bmrKCzJT_ZIn3V3'),

  -- ---------------------------- BEBIDAS -----------------------------
  ('bebidas', 'Craft Smash IPA',
   'Cerveza artesana local, notas cítricas y amargor equilibrado. Maridaje perfecto para toda la carta.',
   5.50, null, false, 1,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuA5b6MZB2h_1KLzklhMcCI5uh4AwrB-WtFhEVXlzpdJVwgEGghVzDceTJtF2vDUplgsORzqljJmcDc02heBO8LRvLj1otHMf4TH3l2Oq3ZQ4-7u8pAPoVOW5O2fTy7fq6PoxFBy7D-opv4CDIJ45wdrEyDpo74yF7OEUwlvZwhxeJmNw3O8rIeE7mbUr5qdGP_NuMJok502egtQw3LEps8qyfFLwXeLzvu3RYIVXy4flK13TaGDDA3ltju6mThGSfiPXoh1FpONYKvS'),

  -- Estas dos bebidas no aparecían en los mockups: se usan fotos libres
  -- de Unsplash, sustituibles desde el panel de administración.
  ('bebidas', 'Limonada de la Casa',
   'Limonada natural con menta fresca y un toque de jengibre.',
   3.50, null, false, 2,
   'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&q=80'),

  ('bebidas', 'Refresco Artesano',
   'Cola, naranja o limón de elaboración artesanal, sin colorantes.',
   3.00, null, false, 3,
   'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80')
) as v(slug_seccion, nombre, descripcion, precio, etiqueta, destacado, orden, imagen_url)
join public.secciones s on s.slug = v.slug_seccion
where not exists (
  select 1 from public.platos p where p.nombre = v.nombre
);
