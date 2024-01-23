
//Required module (install via NPM)
const Crawler = require("crawler");
const Wiki = require("./models/wiki");
const mongoose = require("mongoose");
const pageRank = require("./page-rank");
const {generateMatrix, calculateMatrix, nPIEPIteration} = require("./page-rank");

const host = "https://en.wikipedia.org";
const data = [];
const mongodbUrl = "mongodb://127.0.0.1:27017/as1"

mongoose.connect(mongodbUrl).
  then(() => {
    console.log("Connected to mongodb!")
  }).
  catch(error => console.log(error));

const c = new Crawler({
  maxConnections : 10, //use this for parallel, rateLimit for individual
  //rateLimit: 10000,


  // This will be called for each crawled page
  callback : function (error, res, done) {
    if(error){
      console.log(error);
    }else{
      let $ = res.$; //get cheerio data, see cheerio docs for info

      const title = $("title").text();
      const body = $("#mw-content-text").text();
      const links = [];
      $("#See_also").parent().next('ul').find("li").each((i, link) =>{
        const href = $(link).find("a").attr("href");
        if (href && !href.startsWith("http")) {
          links.push(`${host}${href}`);
        }
      });

      if (!data.find(item => item.link === res.request.uri.href)) {
        data.push({ title, body, link: res.request.uri.href, links, weight: 0 });
      }

      for(let i = 0; i < links.length; i++) {
        if (!data.find(item => item.link === links[i]) && data.length < 500) {
          c.queue(links[i]);
        }
      }
      console.log(`Wiki Queue Size: ${c.queueSize}, Data Size: ${data.length}`);
    }
    done();
  }
});

//Perhaps a useful event
//Triggered when the queue becomes empty
//There are some other events, check crawler docs
c.on('drain',function(){
  console.log("Crawler Done.");

  // Start to deal with the matrix data
  let matdata = generateMatrix(data);
  let result = nPIEPIteration(calculateMatrix(matdata));
  // Turn dat matrix into an 1D array
  let resultInArray = result.to1DArray();

  data.forEach((item, index) => item.weight = resultInArray[index]);

  Wiki.deleteMany({}).then(() => {
    Wiki.insertMany(data).then(() => {
      console.log("Data Added!");
    });
  });
});

//Queue a URL, which starts the crawl
c.queue(`${host}/wiki/Crawler`);
