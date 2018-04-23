const express = require('express');
const path = require('path');
const handlebars = require('express-handlebars');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const nodemailer = require('nodemailer');
const config = require('./config/database');

//connect to db
mongoose.connect(config.database);
let db = mongoose.connection;

//check connection
db.once('open', function(){
  console.log('Connected to MongoDB');
});

//check for db errors
db.on('error', function(err){
  console.log(err);
});

//init app
const app = express();

//static files
app.use('/css', express.static('css'));
app.use('/images', express.static('images'));
app.use('/js', express.static('js'));
app.use('/fonts', express.static('fonts'));
app.use('/videos', express.static('videos'));

//set public folder
app.use(express.static(path.join(__dirname, 'public')));

//express session middleware
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));

//express messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

//express validator middleware
app.use(expressValidator({
    errorFormatter: function(param, msg, value){
      var namespace = param.split('.')
      , root = namespace.shift()
      , formParam = root;

    while(namespace.length){
      formParam += '[' + namespace.shift() + ']';
    }
    return{
      param: formParam,
      msg: msg,
      value: value
    };
  }
}));

//passport config
require('./config/passport')(passport);

//passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function(req, res, next){
  res.locals.user = req.user || null;
  next();
});

//load view engine
app.engine('handlebars', handlebars({extname: 'handlebars'}))
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

//Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

//bring in user, comment and email models
let User = require('./models/user');
let Comment = require('./models/comment');
let Email = require('./models/email');

//home route
app.get('/', function(req, res){
  res.render('index');
});

//registration route
app.get('/sign_up', function(req, res){
    res.render('sign_up');
});

//registration functionality
app.post('/sign_up', function(req, res){
  const username = req.body.username;
  const password = req.body.password;
  const password2 = req.body.password2;
  const email = req.body.email;

  req.checkBody('username', 'Username is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
  req.checkBody('email', 'Email is not valid').isEmail();

  let errors = req.validationErrors();

  if(errors){
    res.render('sign_up', {
      errors:errors,
      msg:'oops, something went wrong...'
    });
  }else{
    let newUser = new User({
      username:username,
      password:password,
      password2:password2,
      email:email
    });
    //password hashing
    bcrypt.genSalt(10, function(err, salt){
      bcrypt.hash(newUser.password, salt, function(err, hash){
        if(err){
          console.log(err);
        }
        newUser.password = hash;
        newUser.save(function(err){
          if(err){
            console.log(err);
            return;
          } else{
            res.render('login', {msg: 'You have been registered and can now log in!'})
          }
        });
      });
    });
  }
});

//login route
app.get('/login', function(req, res){
    res.render('login', {});
});

//login functionality
app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/#1');
  });

//logout
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/#1');
});

//dashboard route
app.get('/dashboard/:id', function(req, res){
  res.render('dashboard');
});

//dashboard update
app.get('/dashboard/:id', function(req, res){
  User.findById(req.params.id, function(err, user){
    res.render('dashboard', {
      user:user
    });
  });
});

app.post('/dashboard/:id', function(req, res){
  let user = {};

  user.username = req.body.username;
  user.password = req.body.password;
  user.password2 = req.body.password;
  user.email = req.body.email;

  let query = {_id:req.params.id}

  User.update(query, user, function(err){
    if(err){
      console.log(err);
    } else {
      res.redirect('/#1')
    }
  });
});

//dashboard delete user
app.delete('/dashboard/:id', function(req, res){
  let query = {_id:req.params.id}

  User.remove(query, function(){
    res.redirect('/#1')
  });
});﻿

//comment display
app.get('/web', function(req, res){
  Comment.find({}, function(err, comments){
    if(err){
      console.log(err);
    } else {
      res.render('web', {
        title: 'Comments section:',
        comments:comments
      });
    }
  });
});

//comment functionality
app.post('/web', function(req, res){
  let comment = new Comment();
  comment.author = req.user.username;
  comment.body = req.body.body;

  comment.save(function(err){
    if(err){
      console.log(err);
      return;
    } else {
      res.redirect('/web')
    }
  });
});

//load edit form
app.get('/web/edit/:username', function(req, res){
  Comment.findById(req.params.id, function(err, comment){
    res.render('edit_web', {
      comment:comment
    });
  });
});

//update comment
app.post('/web/edit/:id', function(req, res){
  let comment = {}
  comment.body = req.body.body;
  let query = {_id:req.params.id}
  Comment.update(query, comment, function(err){
    if(err){
      console.log(err);
      return;
    } else {
      res.redirect('/web')
    }
  });
});

//delete comments
app.delete('/web/:id', function(req, res){
  Comment.findByIdAndRemove(req.params.id, function(err){
    if(err){
      console.log(err);
    } else {
      res.redirect('/web')
    }
  });
});﻿

//contact form
//it sends the message to my email account and saves it in a db
app.post('/', function(req, res){
    var name = req.body.name;
    var email = req.body.email;
    var tel = req.body.tel;
    var website = req.body.website;
    var message = req.body.message;

    var newEmail = new Email({
      name:name,
      email:email,
      tel:tel,
      website:website,
      message:message
    });

    var output = `
        <h3>Contact Details:</h3>
        <ul>
            <li>Name: ${req.body.name}</li>
            <li>Email: ${req.body.email}</li>
            <li>Phone No.: ${req.body.tel}</li>
            <li>Website: ${req.body.website}</li>
        </ul>
        <h3>Message:</h3>
        <p>${req.body.message}</p>
    `;

    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'adamski160994@gmail.com', // generated ethereal user
            pass: 'Arsenal14.'  // generated ethereal password
        },
        tls:{       //delete this when live
            rejectUnauthorized: false
        }
    });

    let mailOptions = {
        from: '"Portfolio Contact" <adamski160994@gmail.com>', // sender address
        to: 'adammo14@hotmail.com', // list of receivers
        subject: 'Contact Form', // Subject line
        html: output
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        newEmail.save();
        res.render('index', {msg: 'Email has been sent'})
    });
});

//other routes
app.get('/graphics', function(req, res){
    res.render('graphics');
});

app.get('/3d', function(req, res){
    res.render('3d');
});

app.get('/about', function(req, res){
    res.render('about');
});

//server init
app.listen(1337, function(){
  console.log('Server running on port 1337');
});
