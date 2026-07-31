# CLAUDE.md

## Proyecto
Aplicación Web de Reservas y Carta Editable para un Restaurante (Snakko)

## Rol del Agente
Desarrollador web con 15 años de experiencia

## Objetivo
Crear una aplicación web para un restaurante donde se pueden hacer reservas y gestionar la carta. Todo se podrá administrar desde un panel de administración centralizado.

---

## Funcionalidades de la Aplicación

### Autenticación
- Login y registro
- Los visitantes tienen acceso a toda la parte pública, pero para hacer reservas o gestionarlas deben registrarse
- Los visitantes registrados se convierten en clientes con rol "Cliente"
- Los usuarios con rol "Administrador" (asignado manualmente) pueden acceder al panel de administración

### Parte Pública
**Sin necesidad de estar logueado:**
- Ver la carta del restaurante
- Ver las diferentes páginas de la web
- Ver información general

**Para hacer una reserva (requiere estar logueado):**
- Comprobación de disponibilidad
- Seleccionar fecha de reserva
- Seleccionar franja horaria
- Crear reserva
- Cancelar reserva
- Gestionar sus reservas

### Acceso de Cliente
- Acceso solo a la parte pública
- Administración de sus propias reservas

### Panel de Administración Privado
**Gestión de Reservas:**
- Listado de reservas
- Modificar reserva
- Cancelar reservas
- Buscar y filtrar reservas

**Gestión de la Carta:**
- CRUD de platos
- CRUD de secciones de la carta
- Cada plato asignado a una sección (Entradas, Hamburguesas, Pollo Broster, Papas Fritas, Postres, Bebidas)
- Subir y gestionar imágenes de platos

**Gestión de Clientes:**
- Listado de clientes
- Crear, editar y eliminar clientes
- Buscar y filtrar clientes

**Dashboard:**
- Estadísticas en tiempo real
- Últimas reservas
- Reservas pendientes

### En General
- Protección de rutas
- Validación de solapamiento de reservas
- Mensajes de confirmación visual (sin alert/confirm/prompt)

---

## Stack de Tecnología
- HTML5
- CSS3 (con Tailwind)
- JavaScript
- React
- Supabase

---

## Preferencias Generales
- Todos los textos visibles en la web deben estar en español

---

## Preferencias de Diseño
- Basarse en los documentos HTML del diseño que están en la carpeta 'design/' del proyecto

## Preferencias de Estilos
- Colores: Los definidos en el diseño
- Medidas en rem, usando font-size base de 10px
- Uso de HTML5 y CSS3 nativo
- Buenas prácticas de maquetación CSS
- Usar Flexbox y CSS Grid Layout cuando sea necesario
- La webapp debe ser responsive

---

## Preferencias de Código

### Generales
- No añadir dependencias externas innecesarias
- HTML debe ser semántico
- Usar siempre 'let' o 'const', nunca 'var'
- Priorizar código legible y mantenible
- Priorizar que el código sea sencillo de entender

### DOM Manipulation
- No usar 'innerHTML'
- Todo el contenido debe ser insertado con 'appendChild()' o creado previamente con 'document.createElement()'

### Eventos
- Cuidado con olvidar prevenir el default en los eventos 'submit' o 'click'
- Siempre usar 'event.preventDefault()'

### Feedback Visual
- No usar 'alert()', 'confirm()' o 'prompt()'
- Todo el feedback debe ser visual en el DOM
- Toda alerta o ventana modal que aparezca debe tener el mismo estilo que la web

### Dudas
- Si el agente duda, debe revisar las especificaciones del proyecto
- Si no encuentra respuesta, debe preguntar al usuario

## Estructura de archivos:
- Carpeta (desing)
- CLAUDE.md
- La estructura exacta puede ser elegida por el agente de IA según las mejores prácticas de React (Lo elige la IA).
