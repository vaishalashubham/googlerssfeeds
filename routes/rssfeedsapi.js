var express = require('express');
var router = express.Router();
var axios = require('axios');
var convert = require('xml-js');

router.get('/googlerssfeeds', function(req, res, next){
   axios.get("https://www.thequint.com/stories.rss")
   .then((dt) => {
      const xml = dt.data;
      var jsonData = convert.xml2json(xml, {compact: true, spaces: 4});
      var rs = JSON.parse(jsonData);
      res.render('index', {'data':  rs, 'lastBuildDate': dt});
   })
});
module.exports = router;