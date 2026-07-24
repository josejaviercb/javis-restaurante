Quiero desplegar este proyecto (Vite + React + Supabase) en Vercel, conectado a GitHub, sin afectar mi entorno ni mi versión local. Guíame paso a paso y ejecutá vos lo que puedas.

Necesito que:

1. Verifiques que exista un .gitignore correcto, asegurándote de que node_modules y cualquier archivo .env (con mis keys de Supabase) NO se suban al repositorio.

2. Inicialices git si no está inicializado, y hagas el primer commit.

3. Me guíes para crear el repositorio en GitHub (usando gh CLI si está disponible, o me digas los pasos exactos si no) y hagas el push.

4. Instales el CLI de Vercel y me guíes para conectar el proyecto (vercel login, vercel link), avisándome cuándo necesitás que yo autorice algo en el navegador.

5. Me digas exactamente qué variables de entorno tengo que copiar a mano en el dashboard de Vercel (basándote en mi archivo .env local), sin mostrar los valores reales en la conversación si es posible.

6. Confirmes que el build command (npm run build) y el output directory (dist) estén bien detectados por Vercel.

7. Al final, me recuerdes que tengo que actualizar la Site URL / Redirect URLs en el dashboard de Supabase Auth con la URL de producción de Vercel.

Antes de ejecutar cualquier comando que modifique algo (git push, deploy, etc.), explicame brevemente qué va a hacer y esperá mi confirmación.