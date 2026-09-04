const fs = require('fs');
const path = 'src/content/casos/guardia-medica.js';
let content = fs.readFileSync(path, 'utf8');

const oldImagesArray = `[
    { url: 'https://www.loom.com/share/c8a4985fbfe446cea3c50da0d90b7546', alt: 'Demostración de ingreso de paciente' },
    { url: 'https://www.loom.com/share/5f381f835aa84788ad86749296402dc0', alt: 'Gestión de la cola de espera' },
    { url: 'https://www.loom.com/share/e1f2ecdb58954bc397fdbaada4cb98ab', alt: 'Atención médica y egreso' },
    { url: '/assets/guardia/guardia-1.png', alt: 'Captura del formulario de admisión' },
    { url: '/assets/guardia/guardia-2.png', alt: 'Validación de signos vitales' },
    { url: '/assets/guardia/guardia-3.png', alt: 'Pantalla de triaje ordenado' },
    { url: '/assets/guardia/guardia-4.png', alt: 'Registro de atención por médico' }
  ]`;

const newImagesArray = `[
    { url: '/assets/guardia/guardia-2.png', alt: 'Validación de signos vitales' },
    { url: '/assets/guardia/guardia-1.png', alt: 'Captura del formulario de admisión' },
    { url: '/assets/guardia/guardia-3.png', alt: 'Pantalla de triaje ordenado' },
    { url: '/assets/guardia/guardia-4.png', alt: 'Registro de atención por médico' },
    { url: 'https://www.loom.com/share/c8a4985fbfe446cea3c50da0d90b7546', alt: 'Demostración de ingreso de paciente' },
    { url: 'https://www.loom.com/share/5f381f835aa84788ad86749296402dc0', alt: 'Gestión de la cola de espera' },
    { url: 'https://www.loom.com/share/e1f2ecdb58954bc397fdbaada4cb98ab', alt: 'Atención médica y egreso' }
  ]`;

content = content.replace(oldImagesArray, newImagesArray);
fs.writeFileSync(path, content);
console.log('Reordered images in guardia-medica.js');
