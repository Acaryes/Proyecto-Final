import express from "express";
import productRouter from './routes/product.route.js';
import cartRouter from './routes/cart.route.js';
import userRouter from './routes/user.route.js';
import otherRouter from './routes/other.route.js';
import session from 'express-session';
import {engine} from 'express-handlebars';
import path from 'path';
import {fileURLToPath} from 'url';
import mongoStore from 'connect-mongo';
import compression from 'compression';
import minimist from 'minimist';
import logger from "./utils/loggers/Log4jsLogger.js";
import loggerMiddleware from "./middlewares/routesLogger.middleware.js";
const app = express();
import { Server } from 'socket.io';
import http from 'http';
const server = http.createServer(app);
const io = new Server(server);

import Contenedor from './contenedor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const chat = new Contenedor("chat.json")

app.use(loggerMiddleware);
app.use(express.static('public'));
app.use(compression());
app.set('views', './src/views');
app.set('view engine', 'hbs');

app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'index.hbs',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials'
}))

app.use(
    session({
        store: mongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            options: {
                userNewParser: true,
                useUnifiedTopology: true,
            }
        }),
        secret: 'secreto',
        resave: true,
        saveUninitialized: true,
        cookie: {maxAge: 600000} //10 min.
        
}))

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use('/api/productos', productRouter);
app.use('/api/carrito', cartRouter);
app.use('/api/usuario', userRouter);
app.use('/test', otherRouter);


app.all("*", (req, res) => {
    res.status(404).json({"error": "ruta no existente"})
  });

/* --------------- Leer el puerto por consola o setear default -------------- */

const options = {
    alias: {
        "p": "PORT"
    },
    default: {
        "PORT": 8080
    }
};

io.on('connection', async(socket) => {
//make a chat with socket.io  and save the messages in a file  (chat.json)    




   console.log('🟢 Usuario conectado')
   
   

   const mensajes = await chat.getAll();
   socket.emit('listaMensajesBienvenida', mensajes)
   
   socket.on('nuevoMensaje', async(data) => {
       await chat.save(data);
       
       
       const mensajes = await chat.getAll();
       io.sockets.emit('listaMensajesActualizada', mensajes)
   })

   
   socket.on('disconnect', () => {
       console.log('🔴 Usuario desconectado')
   })
   
})

app._router.stack.forEach(function (r) {
    if (r.route && r.route.path) {
      console.log(r.route.path)
    }
  });

  const PORT = 13213;
  server.listen(PORT, () => {
      console.log(` >>>>> 🚀 Server started at http://localhost:${PORT}`)
  })
    
server.on('error', (err) => logger.error(err));

