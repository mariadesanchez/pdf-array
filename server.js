const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Directorio donde se guardarán los archivos

// Antes de tus rutas, usa el middleware CORS
// app.use(cors());

const express = require("express")
const app = express()
const cors = require("cors")
    // Configura las opciones de CORS
const corsOptions = {
    origin: 'https://pdf-converter-kappa.vercel.app/App', // Reemplaza con tu dominio de frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
};

// app.use(cors(corsOptions));
app.use(express.json())
app.use(cors())

app.get("/", (req, res) => {
    res.send("Todo okey")
})

app.post('/pdfviewer', upload.single('pdfFile'), async(req, res) => {
            try {
                const pdfPath = req.file.path; // Ruta al archivo PDF cargado
                const dataBuffer = fs.readFileSync(pdfPath);
                const data = await pdf(dataBuffer);
                const text = data.text;

                // Divide el contenido del PDF en líneas
                const lines = text.split('\n');

                // Resto del procesamiento del PDF y generación de la tabla HTML, similar a la ruta GET

                // Inicializa un array de objetos "docente"
                let docente = [];

                for (const line of lines) {
                    // Elimina el espacio en blanco inicial
                    const trimmedLine = line.trim();

                    if (/^\d{8}\//.test(trimmedLine)) {
                        const columns = trimmedLine.split(' '); // Divide la línea en columnas

                        // Asegúrate de que haya al menos 4 columnas
                        if (columns.length >= 4) {
                            const primeraColumnaNumerica = parseInt(columns[0].split('/')[0], 10);
                            const segundaColumna = columns[1];
                            const terceraColumna = columns[2];
                            let cuartaColumna = columns.slice(3).join(' ');
                            cuartaColumna = cuartaColumna.replace(/ T .*:/, ':'); // Elimina desde ' T ' hasta ':'
                            const cuartaColumnaNumerica = extractNumberFromLastToColon(cuartaColumna);

                            // Elimina ':' y todo lo que viene después en la columna duplicada
                            let cuartaColumnaDuplicada = cuartaColumna.split(':')[0];

                            // Elimina 'S' y todo lo que viene después en la columna duplicada
                            cuartaColumnaDuplicada = cuartaColumnaDuplicada.replace(/S.*$/, '');

                            docente.push({
                                dni: primeraColumnaNumerica,
                                datos: `${segundaColumna} ${terceraColumna}`,
                                importe: cuartaColumnaNumerica,
                            });
                        }
                    }
                }

                // Elimina duplicados y suma los valores de la columna "importe"
                let uniqueDocente = [];
                docente.forEach((item) => {
                    let existingItem = uniqueDocente.find((x) => x.dni === item.dni);
                    if (existingItem) {
                        existingItem.importe += item.importe;
                    } else {
                        uniqueDocente.push(item);
                    }
                });

                // Ordena los datos por la columna "datos" de manera ascendente
                uniqueDocente.sort((a, b) => (a.datos > b.datos ? 1 : -1));

                // Genera una tabla HTML con los datos de "uniqueDocente"
                const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title></title>
        <h3>PLANILLA RESUMEN DE INCENTIVO DOCENTE</h3>
        <style>
          table {
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid black;
            padding: 8px;
          }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>DNI</th>
              <th>Datos</th>
              <th>Importe</th>
            </tr>
          </thead>
          <tbody>
            ${uniqueDocente
              .map(
                (item) => `
              <tr>
                <td>${item.dni}</td>
                <td>${item.datos}</td>
                <td>${item.importe}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Envía la página HTML con la tabla al cliente
    res.send(html);
  } catch (error) {
    console.error('Error al procesar el PDF:', error);
    res.status(500).json({ error: 'Error al procesar el PDF' });
  }
});
app.listen(3000, () => {
  console.log("servidor corriendo")
})