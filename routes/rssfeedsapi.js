var express = require('express');
var router = express.Router();
var axios = require('axios');
var convert = require('xml-js');
// var RSS = require('rss-generator');
var RSS = require('rss');

router.get('/googlerssfeeds', async function(req, res, next){
   var stype = req.query.section;
   var slimit = req.query.limit;
   var ltDate = "";
   var storieId = "";
   var obj = {
      'title': "",
      'desc': ""
   };

   var mTitle = "";
   var mDesc = "";
   var lbd = "";
   var mDate = "";

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
      // res.render('index', {'xmldata': xml,'data':  rs, 'metadata': obj, 'lbd':ltDate, 'type': stype, 'limit': slimit });
      // res.send(Action); 
      // console.log(Action);

      if (typeof stype === "undefined") {
         mDate = rs['rss']['channel']['lastBuildDate']['_text'];
      } else {
        if (lbd !== "") {
         mDate = ltDate;
        } else {
          const currDate = new Date().toString();
          mDate = currDate.slice(0, 3)+ ", " + currDate.slice(8, 10) + " " + currDate.slice(4, 7) + currDate.slice(10, 24)+ " +0530";
        }
      }

      if (typeof stype !== "undefined" && obj['title'] !== "") {
         mTitle = obj['title'];
         mDesc = obj['desc'];
      } else {
        mTitle = "The Quint";
        mDesc = "Latest News, Breaking News, Online India News, Cricket News, Viral Videos - quint";
      }
   
      var feed = new RSS({
         custom_namespaces: {
            'media': "http://search.yahoo.com/mrss/"
         },
            // lastBuildDate: mDate,
            // title: mTitle,
            // description: mDesc,
            // site_url: "www.thequint.com",
         custom_elements: [
            {lastBuildDate: mDate},
            {title: mTitle},
            {description: mDesc},
            {link: "www.thequint.com"},
         ]
      });

      var count = 0;
      for (let i=0; i < rs['rss']['channel']['item'].length; i++) {
        if (typeof rs['rss']['channel']['item'][i]['category'].length !== "undefined") {
           for (let j=0; j< rs['rss']['channel']['item'][i]['category'].length; j++) {
             if (typeof stype !== "undefined") {
                if (count < slimit) {
                   if (rs['rss']['channel']['item'][i]['category'][j]['_text'] == stype) {
                        count++;
                        feed.item({
                           guid: rs['rss']['channel']['item'][i]['guid']['_text'],
                           // pubDate: rs['rss']['channel']['item'][i]['pubDate']['_text'],
                           title: rs['rss']['channel']['item'][i]['title']['_text'],
                           description: rs['rss']['channel']['item'][i]['description']['_cdata'],
                           custom_elements: [
                              // {'guid': [{
                              //    _attr: {
                              //       isPermaLink: "false"
                              //    },
                              //  },rs['rss']['channel']['item'][i]['guid']['_text']],
                              // },
                              {'pubDate': rs['rss']['channel']['item'][i]['pubDate']['_text']},
                              // {'title':  rs['rss']['channel']['item'][i]['title']['_text']},
                              // {'description': rs['rss']['channel']['item'][i]['description']['_cdata']},
                              {'content:encoded': { _cdata: rs['rss']['channel']['item'][i]['content:encoded']['_cdata'] }},
                              {link: rs['rss']['channel']['item'][i]['link']['_text']},
                              {'media:content': [{
                                 _attr: {
                                   height: rs['rss']['channel']['item'][i]['media:content']['_attributes']['height'],
                                   width: rs['rss']['channel']['item'][i]['media:content']['_attributes']['width'],
                                 }
                               }]
                              },
                              {author: rs['rss']['channel']['item'][i]['atom:author']['atom:name']['_text']} 
                           ]
                        });
                    }
                 }
              }
            }
         }
         if (typeof stype === "undefined") {
            feed.item({
               guid: rs['rss']['channel']['item'][i]['guid']['_text'],
               // pubDate: rs['rss']['channel']['item'][i]['pubDate']['_text'],
               title: rs['rss']['channel']['item'][i]['title']['_text'],
               description: rs['rss']['channel']['item'][i]['description']['_cdata'],
               custom_elements: [
                  // {'guid': [{
                  //    _attr: {
                  //       isPermaLink: "false"
                  //    }
                  //  },rs['rss']['channel']['item'][i]['guid']['_text']],
                  // },
                  {'pubDate': rs['rss']['channel']['item'][i]['pubDate']['_text']},
                  // {title:  rs['rss']['channel']['item'][i]['title']['_text']},
                  // {'description': rs['rss']['channel']['item'][i]['description']['_cdata']},
                  {'content:encoded':  { _cdata: rs['rss']['channel']['item'][i]['content:encoded']['_cdata'] }},
                  {link: rs['rss']['channel']['item'][i]['link']['_text']},
                  {'media:content': [{
                     _attr: {
                       height: rs['rss']['channel']['item'][i]['media:content']['_attributes']['height'],
                       width: rs['rss']['channel']['item'][i]['media:content']['_attributes']['width'],
                     }
                   }]
                  },
                  {author: rs['rss']['channel']['item'][i]['atom:author']['atom:name']['_text']} 
               ]
            });
         }
         if (typeof stype !== "undefined") {
            if (count < slimit) {
              if (typeof rs['rss']['channel']['item'][i]['category'].length === "undefined") {
                 if (rs['rss']['channel']['item'][i]['category']['_text'] === stype) {
                     count++;
                     feed.item({
                        guid: rs['rss']['channel']['item'][i]['guid']['_text'],
                        // pubDate: rs['rss']['channel']['item'][i]['pubDate']['_text'],
                        title: rs['rss']['channel']['item'][i]['title']['_text'],
                        description: rs['rss']['channel']['item'][i]['description']['_cdata'],
                        custom_elements: [
                           // {'guid': [{
                           //    _attr: {
                           //       isPermaLink: "false"
                           //    }
                           //  },rs['rss']['channel']['item'][i]['guid']['_text']],
                           // },
                           {'pubDate': rs['rss']['channel']['item'][i]['pubDate']['_text']},
                           // {'title':  rs['rss']['channel']['item'][i]['title']['_text']},
                           // {'description': rs['rss']['channel']['item'][i]['description']['_cdata']},
                           {'content:encoded':  { _cdata: rs['rss']['channel']['item'][i]['content:encoded']['_cdata'] }},
                           {link: rs['rss']['channel']['item'][i]['link']['_text']},
                           {'media:content': [{
                              _attr: {
                                height: rs['rss']['channel']['item'][i]['media:content']['_attributes']['height'],
                                width: rs['rss']['channel']['item'][i]['media:content']['_attributes']['width'],
                              }
                            }]
                           },
                           {author: rs['rss']['channel']['item'][i]['atom:author']['atom:name']['_text']} 
                        ]
                     });
                  }
               }
            }
         }  
      }

      var act = feed.xml();
      res.type('application/xml').send(act);
   });
});
module.exports = router;