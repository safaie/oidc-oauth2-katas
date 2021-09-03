const os = require("os");
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const logger = require('morgan');
const uuid = require('uuid');

const client_title = process.env.CLIENT_TITLE || 'Object Store v2';
const client_stylefile = process.env.CLIENT_STYLEFILE || 'style.css';
const port = process.env.CLIENT_PORT || 5000;

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('combined'));
app.use(express.static('src/static'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());

const objects = {};

objects[uuid.v4()] = {title: 'Test object'}

// Serve front page
app.get('/', (req, res) => {
    console.log('Headers in request:', req.headers)
    const username = req.headers['x-forwarded-preferred-username']

    // Create a random nonce, that can be used to validate, proves the
    // source of the POST request received the form from a valid
    // client.  Real nonce's should be unguessable, i.e. be
    // dynamically created.
    const csrf_nonce = uuid.v4();

    res.cookie('object-store-csrf', csrf_nonce, {secure: true, httpOnly: true})
       .render('index', {client_title,
			 client_stylefile,
			 username,
			 csrf: csrf_nonce,
			 objects});
});

app.post('/object', (req, res) => {
    csrf_nonce = req.body['csrf-nonce'];
    csrf_cookie = req.cookies['object-store-csrf'];
    if (!csrf_nonce || csrf_nonce != csrf_cookie) {
	console.warn('CSRF error, nonce', csrf_nonce, 'cookie', csrf_cookie);
    } else {
	const id = uuid.v4();
	objects[id] = req.body.content;
	console.log("Created object ", id, ", content '"+objects[id]+"'");
    }
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Object store listening on port ${port}!`);
});
