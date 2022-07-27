const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const axios = require('axios');
const jsdom = require("jsdom");
const { json } = require("body-parser");
const { JSDOM } = jsdom;
var bodyParser = require('body-parser')
let content;
app.set('view engine', 'ejs');
app.use(
    express.urlencoded({
      extended: true,
    })
);
app.use( bodyParser.json() );      
    app.use(bodyParser.urlencoded({    
        extended: true
    })
)
app.use(express.json());
app.get("/", (req, res) => {
  try {
    res.render("index");
  } catch (err) {
    console.log(err);
  }
});
app.post('/', (req, res) => {
    let url = req.body.inputUrl;
    let html = getArticleData(url);
    html.then(response => {
        console.log(typeof response );
        const dom = new jsdom.JSDOM(response);
        var scripts = dom.window.document.getElementsByTagName("script");
        for (var i = 0; i < scripts.length; ++i) {
            if(scripts[i].type == 'application/ld+json') {
                let parsedJson = JSON.parse(scripts[i].innerHTML)
                if(parsedJson.articleBody != "") {
                    content = parsedJson;
                }
            }
        }
        res.render("article", { headline: content.headline, alternativeHeadline: content.alternativeHeadline, description: content.description, articleBody: content.articleBody });
    })
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

async function getArticleData(url) {
    try {
        let res = await axios({
             url: url,
             method: 'get',
             timeout: 8000
         })
         if(res.status == 200){
             console.log(res.status)
         }
         return res.data
     }
     catch (err) {
         console.error(err);
     }
}