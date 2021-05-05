const express = require("express");
const app = express();
var mysql = require('mysql');
var routerGetpost = require("./routes/getpost");
const morgan = require("morgan");//its a middleweare 
const bodyParser = require("body-parser");
const dotEnv = require("dotenv");

dotEnv.config();
//allow cors policy
var cors = require('cors');
app.use(cors());
app.use(express.static('files'));
app.use('/uploads', express.static('uploads'))
//var fs = require('fs');
//var http = require('http');
//var https = require('https');
//var privateKey = fs.readFileSync('./cert/server-decrypted.key', 'utf8');
//var certificate = fs.readFileSync('./cert/server.crt', 'utf8');
//var credentials = {key: privateKey, cert: certificate};
// var con = mysql.createConnection({
//   host: "mmkndmobdev",
//   port:"3306",
//   user: "root",
//   password: "pass,123",
//   database: "doctorapp"
// });
 
var con;
var db_config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'mydb'
};

// var db_config = {
//   host: "localhost",
//   port:"3306",
//   user: "root",
//   password: "Mahindra@123",
//   database: "doctorapp"
// }

app.use(morgan('dev'));
//app.use(bodyParser.json());//middlewr which parse body into json format so that we can retrieve variable passed in api
app.use(bodyParser.json({limit: '50mb', extended: true}))
app.use('/',routerGetpost);
console.log("Connected!",process.env.port);

function handleDisconnect() {
  con = mysql.createConnection(db_config);   
  // Recreate the connection, since the old one cannot be reused.
  con.connect(function(err) {             // The server is either down
    if(err) {                             // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); 
      // to avoid a hot loop, and to allow our node script to
      // We introduce a delay before attempting to reconnect,
      // process asynchronous requests in the meantime.
      // If you're also serving http, display a 503 error.
    }else{
      console.log("Connected!",process.env.port);
      app.use(morgan('dev'));
      //middlewr which parse body into json format so that we can retrieve variable passed in api
      app.use(bodyParser.json());
      app.use('/',routerGetpost);
    }                                       
  });                                                                                    
  con.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {// Connection to the MySQL server is usually
      handleDisconnect();                        // lost due to either server restart, or a
    } else {   
      setTimeout(handleDisconnect, 20000);       // connnection idle timeout (the wait_timeout
      throw err;                                 // server variable configures this)
    }
  });
}
//handleDisconnect();

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

//app.set('port', process.env.port);
 
//var httpServer = http.createServer(app);
//var httpsServer = https.createServer(credentials, app);
//httpServer.listen(8080);
//httpsServer.listen(process.env.port);
 app.listen(process.env.port);