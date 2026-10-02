require('dotenv').config();
const app = require('./src/app');
const supabase = require('./src/config/supabaseClient');

const PORT = process.env.PORT || 3000;

async function startServer() {
  console.log('\n[*] Iniciando servicios, por favor espera...');

  // Probar conexion a la base de datos (Supabase)
  let dbStatus = 'Desconectado';
  try {
    const { error } = await supabase.from('roles').select('id').limit(1);
    if (!error) {
      dbStatus = 'Conectado exitosamente a Supabase';
    } else {
      dbStatus = `Conectado con advertencias: ${error.message}`;
    }
  } catch (err) {
    dbStatus = `Error critico conectando a la BD: ${err.message}`;
  }

  app.listen(PORT, () => {
    console.log('\n======================================================');
    console.log('       CENTRIX BACKEND ESTA EN LINEA (CQRS)           ');
    console.log('======================================================');
    console.log(`[*] Base de Datos : ${dbStatus}`);
    console.log(`[*] Servidor Local: http://localhost:${PORT}`);
    console.log(`[*] Health Check  : http://localhost:${PORT}/health`);
    console.log('======================================================\n');
  });
}

startServer();
