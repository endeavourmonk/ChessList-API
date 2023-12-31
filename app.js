const express = require('express');
const passport = require('passport');
const { Server } = require('socket.io');
const session = require('express-session');
const { createServer } = require('node:http');

const authRouter = require('./routes/auth');
const userRouter = require('./routes/users');
const homeRouter = require('./routes/home');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/error');

const passportSetup = require('./config/passport');

const app = express();
const server = createServer(app);
const io = new Server(server);

// set the view engine to ejs
app.set('view engine', 'ejs');

// express session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: false,
      maxAge: 15 * 24 * 60 * 60 * 1000,
    },
  }),
);

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());
// app.use(passport.authenticate('session'));

// Parse incoming requests with JSON payloads.
app.use(express.json({ limit: '10kb' }));

// realtime socket connection
io.on('connection', (socket) => {
  console.log('a user connected');

  // Listen for 'chatMessage' events from the connected socket
  socket.on('chatMessage', (data) => {
    // Broadcast the received message to all connected sockets, including the sender
    io.emit('chatMessage', data);
  });

  // Handle socket disconnection
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// app.get('/', homeRouter);
app.get('/', (req, res, next) => {
  res.render('home');
});
app.use('/users', userRouter);
app.use('/auth', authRouter);

// if none of the above routes matched
app.all('*', (req, res, next) => {
  next(new AppError(404, `${req.originalUrl} not found`));
});

// Global error Handling
app.use(globalErrorHandler);

server.listen(3000, () => {
  console.log(`💻 App running on 3000 🏃`);
});

module.exports = app;
