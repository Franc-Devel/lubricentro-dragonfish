import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', productRoutes);

app.listen(PORT, () => {
  console.log('💻 Servidor Dragonfish corriendo en el puerto ' + PORT);
});