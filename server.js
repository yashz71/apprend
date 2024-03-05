let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let product = require('./routes/products');
var fs = require('fs');
var path = require('path');
let Product = require('./model/product');
let lr= require('./middleware/ratelimit');



let mongoose = require('mongoose');
mongoose.Promise = global.Promise;
//mongoose.set('debug', true);
var multer = require('multer');

var storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads')
	},
	filename: (req, file, cb) => {
		cb(null, file.fieldname + '-' + Date.now())
	}
});

var upload = multer({ storage: storage });


// remplacer toute cette chaine par l'URI de connexion à votre propre base dans le cloud s
const uri = 'mongodb+srv://zaouiyash:kZZcRAvQe1Y9HVak@cluster0.9ovk1e2.mongodb.net/products?retryWrites=true&w=majority&appName=Cluster0';
app.set('view engine', 'ejs');

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify:false
};

mongoose.connect(uri, options)
  .then(() => {
    console.log("Connecté à la base MongoDB products dans le cloud !");
    console.log("at URI = " + uri);
    console.log("vérifiez with http://localhost:8010/api/products que cela fonctionne")
    },
    err => {
      console.log('Erreur de connexion: ', err);
    });

// Pour accepter les connexions cross-domain (CORS)
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

// Pour les formulaires
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

let port = process.env.PORT || 8010;

// les routes
const prefix = '/api';

app.route(prefix + '/products',lr.limitRequests(5, 10))
  .get(product.getProducts);

/*app.route(prefix + '/courses/:id')
  
  .delete(product.deleteproduct);*/
app.route(prefix + '/products/:title',lr.limitRequests(5, 10))
  .get(product.getProduct);

  app.post('/', upload.single('image'), (req, res, next) => {

    var obj = {
      title: req.body.title, 
      desc: req.body.desc,
      price: req.body.price,
      categorie: req.body.categorie,
      img: {
        data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
        contentType: 'image/png'
      }
    }
    Product.create(obj)
    .then ((err, item) => {
      if (err) {
        console.log(err);
      }else{
        res.redirect('/');
      }
      
    });
  });


// On démarre le serveur
app.listen(port, "0.0.0.0");
console.log('Serveur démarré sur http://localhost:' + port);

module.exports = app;


