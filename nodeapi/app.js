var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const { isAPI } = require('./lib/utils');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').__express);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// para servir ficheros estáticos
app.use(express.static(path.join(__dirname, 'public')));
// app.use('/pdfs', express.static('e:\pdfs'));

// Configuramos multiidioma en express
const i18n = require('./lib/i18nConfigure')();
app.use(i18n.init);
/*
console.log(i18n.__('Application title'));
console.log(i18n.__('Name and age', {name: 'Javier', age: 46}));
console.log(i18n.__({phrase: 'Application title', locale: 'es'})); // Forzar locale
*/

// Variables globales de template
app.locals.titulo = 'NodeAPI';

/**
 * Conectamos a la base de datos
 * y registramos los modelos
 */
require('./lib/connectMongoose');
require('./models/Agente');

/**
 * Rutas de mi API
 */
app.use('/apiv1/agentes', require('./routes/apiv1/agentes'));

/**
 * Inicializamos las sesions
 */
app.use(session({
  name: 'nodeapi-session',
  secret: ';44z,a,J3$[[4,)&*J6BxRSa^y/6`:Ht4GvR#=Ky{T',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Si true solo se enviara con HTTPS
    maxAge: 2 * 24 * 60 * 60 * 1000, // 2 días de inactividad
    httpOnly: true
  },
  store: new MongoStore({
    // como conectarse a la base de datos
    url: process.env.MONGOOSE_CONNECTION_STRING
  })
}));

/**
 * Auth helper middleware
 * Acceso a la sesión desde las vistas
 */
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

/**
 * Rutas de mi aplicación web
 */
const loginController = require('./routes/loginControler');

app.use('/',        require('./routes/index'));
app.use('/about',   require('./routes/about'));
app.use('/lang',   require('./routes/lang'));
app.use('/privado',   require('./routes/privado'));
app.get('/login', loginController.index); // Utilizamos el método index de la clase login.
app.post('/login', loginController.post);
app.get('/logout', loginController.logout);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {

  // error de validación
  if (err.array) {
    err.status = 422;
    const errorInfo = err.array({ onlyFirstError: true })[0];
    err.message =  isAPI(req) ? 
      { message: 'Not valid', errors: err.mapped() } 
      : `Not valid - ${errorInfo.param} ${errorInfo.msg}`;
  }

  res.status(err.status || 500);

  if (isAPI(req)) {
    res.json({ success: false, error: err.message });
    return;
  }

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.render('error');
});

module.exports = app;
