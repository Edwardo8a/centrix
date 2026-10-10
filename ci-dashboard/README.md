# CI Pipeline Agent Dashboard

Un dashboard moderno interactivo que visualiza el progreso de un pipeline CI/CD utilizando un "Agente Inteligente" que reporta los avances.

## 1. Qué hace el agente
El agente monitorea visualmente los estados de un pipeline simulado y comunica al usuario, de manera conversacional, el progreso y los problemas encontrados durante cada etapa (Source, Build, Test, Lint, Security, Deploy). 

## 2. Cómo ejecutar el proyecto
Debido a que este proyecto utiliza Vite + React:
1. Asegúrate de tener Node.js instalado en tu entorno.
2. Abre una terminal en este directorio (`ci-dashboard`).
3. Ejecuta `npm install`
4. Ejecuta `npm run dev`
5. Abre la URL local mostrada en tu navegador (usualmente `http://localhost:5173`).

## 3. Cómo funciona la simulación
En la parte superior existe un selector "Simulation result". Al elegir un resultado y presionar "Ejecutar Pipeline", un ciclo asíncrono simula los tiempos y logs de cada etapa. Si se elige un escenario de fallo (ej. Test failed), la simulación avanzará hasta la etapa correspondiente, la marcará en rojo, detendrá el progreso y actualizará el mensaje del agente y las estadísticas para mostrar el error en pantalla.

## 4. Cómo conectar posteriormente un pipeline CI real
Actualmente, el estado del pipeline vive en `src/App.jsx` y se simula en la función `runPipeline()`. Para conectarlo a un CI real (por ejemplo, GitHub Actions, GitLab CI o Jenkins):
- Crea un `useEffect` que abra un WebSocket o haga polling (REST API) hacia tu backend donde procesas los webhooks del CI.
- A medida que lleguen eventos (ej. `stage_started`, `stage_failed`, `logs`), actualiza el estado de react `stages` y los `logs`.
- Usa los mismos IDs de etapas (`source`, `build`, `test`, `lint`, `security`, `deploy`) en tus eventos para empatar con la interfaz visual.

## 5. Qué partes representan inteligencia del agente
El componente `AgentPanel.jsx` (en conjunto con los mensajes definidos en `src/data/pipelineData.js`) funge como un ente "observador". Sus mensajes y colores cambian automáticamente dependiendo de la etapa actual o los errores encontrados. Esta simplificación permite a los usuarios o miembros de negocio saber exactamente en qué estado está el sistema sin necesidad de leer logs técnicos completos.
