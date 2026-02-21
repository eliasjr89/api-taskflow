import autocannon from 'autocannon';
import axios from 'axios';

async function run() {
  try {
    // 1. Conseguir Token Administrativo
    const res = await axios.post('http://localhost:3000/taskflow/auth/login', {
      email: 'admin@taskflow.com',
      password: 'Admin123',
    });
    const token = res.data.data.token;

    console.log(
      '✅ Token obtenido con éxito. Iniciando test a /taskflow/projects...',
    );

    // 2. Correr la prueba por 10 segundos con 10 conexiones simultáneas
    const instance = autocannon(
      {
        url: 'http://localhost:3000/taskflow/projects',
        connections: 10,
        pipelining: 1,
        duration: 10,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      (err, result) => {
        if (err) {
          console.error('Error durante la prueba:', err);
        } else {
          console.log(
            '\n--- RESULTADOS ACTUALES DE LA BASE DE DATOS (SIN CACHÉ) ---\n',
          );
          console.log(
            `⏱️  Peticiones Totales (Reqs/Sec promedio): ${result.requests.average}`,
          );
          console.log(
            `📉 Latencia Promedio (ms): ${result.latency.average} ms`,
          );
          console.log(
            `🚫 Peticiones Fallidas (Errores/Timeout): ${result.errors}`,
          );
          console.log(
            `📦 Rendimiento de Transferencia: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/segun\n`,
          );
        }
      },
    );

    autocannon.track(instance, { renderProgressBar: true });
  } catch (error) {
    console.error('Error inicializando el Autocannon:', error.message);
  }
}

run();
