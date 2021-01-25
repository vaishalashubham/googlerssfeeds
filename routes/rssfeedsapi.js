var express = require('express');
var router = express.Router();
var axios = require('axios');
var convert = require('xml-js');

router.get('/googlerssfeeds', async function(req, res, next){
   var stype = req.param("section");
   var slimit = req.param("limit");
   var ltDate = "";
   var storieId = "";
   var obj = {
      'title': "",
      'desc': ""
   };

   if (!slimit) {
     slimit = 15;
   }
   
   if (typeof stype !== "undefined") {
      await axios.get("https://www.thequint.com/api/v1/stories")
      .then((st) => {
         const allStories = st.data.stories;
         for (let i = 0; i < allStories.length; i++) {
            if (allStories[i]["sections"][0]["name"] === stype) { 
               storieId = allStories[i]["sections"][0]["id"];
               const date = new Date(allStories[i]["last-published-at"]).toString();
               ltDate = date.slice(0, 3)+ ", " + date.slice(8, 10) + " " + date.slice(4, 7) + date.slice(10, 24)+ " +0530";
               return;
            } 
         }
      })
      await axios.get("https://www.thequint.com/api/v1/config")
      .then((confData) => {
         const allConfig = confData.data['seo-metadata'];
         for (let i = 0; i < allConfig.length; i++) {
            if (storieId === allConfig[i]['owner-id']) {
               obj['title'] = allConfig[i]['data']['title'];
               obj['desc'] = allConfig[i]['data']['description'];
            }  
         }  
      })
   }

   await axios.get("https://www.thequint.com/stories.rss")
   .then((dt) => {
      const xml = dt.data;
      var jsonData = convert.xml2json(xml, {compact: true, spaces: 4});
      var rs = JSON.parse(jsonData);
      res.render('index', {'xmldata': xml,'data':  rs, 'metadata': obj, 'lbd':ltDate, 'type': stype, 'limit': slimit });
   })
});
module.exports = router;