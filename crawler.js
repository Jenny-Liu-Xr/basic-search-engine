
//Required module (install via NPM)
const Crawler = require("crawler");
const Fruit = require("./models/fruit");
const mongoose = require("mongoose");
const {generateMatrix, nPIEPIteration, calculateMatrix} = require("./page-rank");

const host = "https://people.scs.carleton.ca/~davidmckenney/fruitgraph";
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
      const body = $("p").text();
      const links = [];
      $("a").each((i, link) =>{
        const href = $(link).attr('href')
        links.push(`${host}${href.slice(1)}`);
      });

      if (!data.find(item => item.link === res.request.uri.href)) {
        data.push({ title, body, link: res.request.uri.href, links, weight: 0 });
      }

      for(let i = 0; i < links.length; i++) {
        if (!data.find(item => item.link === links[i])) {
          c.queue(links[i]);
        }
      }
      console.log(`Fruit Queue Size: ${c.queueSize}, Data Size: ${data.length}`);
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

  Fruit.deleteMany({}).then(() => {
    Fruit.insertMany(data).then(() => {
      console.log("Data Added!");
    });
  })
});

//Queue a URL, which starts the crawl
c.queue(`${host}/N-0.html`);
