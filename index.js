const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const axios = require('axios');
const jsdom = require("jsdom");
const { json } = require("body-parser");
const { JSDOM } = jsdom;
var bodyParser = require('body-parser')
let content;
const cache = {};
const maxCacheSize = 1000;
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
    let baseUrl = url.split('/')[2]
    if(baseUrl != 'lvz.de' && baseUrl != 'www.lvz.de') {
        res.render("article", { headline: 'Das ist kein LVZ Artikel.',  description: "", articleBody: "" })
        return
    }
    if(url in cache) {
        content = cache[url]
        res.render("article", { headline: content.headline, description: content.description, articleBody: content.articleBody });
        return
    }
    let html = getArticleData(url);
    html.then(response => {
        const dom = new jsdom.JSDOM(response);
        var scripts = dom.window.document.getElementsByTagName("script");
        for (var i = 0; i < scripts.length; ++i) {
            if(scripts[i].type == 'application/ld+json') {
                let parsedJson = JSON.parse(scripts[i].innerHTML)
                if(parsedJson.articleBody != "") {
                    content = parsedJson;
                    content.time = Date.now()
                    cache[url] = content
                }
            }
        }
        if(Object.keys(cache).length > maxCacheSize) {
            let oldest = Object.keys(cache).reduce((key, v) => cache[v] < cache[key] ? v : key);
            delete cache[oldest]
            console.log("deleted oldest")
            console.log(cache)
        }
        res.render("article", { headline: content.headline, description: content.description, articleBody: content.articleBody });
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