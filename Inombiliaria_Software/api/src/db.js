const mongoose = require('mongoose');

// Conecta a la MISMA base de datos que usa el backend NestJS.
// Al ser schema-less no hay migraciones: las colecciones nuevas
// (acuerdosfirmas, pdfs.files) coexisten sin tocar nada existente.
async function conectar() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/habitat-capital';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('MongoDB conectado');
}

module.exports = conectar;
