const http = require('http');
const fs = require('fs');
const mongoose = require("mongoose");
const Fruit = require("./models/fruit");
const elasticlunr = require("elasticlunr");
const Wiki = require("./models/wiki");

const mongodbUrl = "mongodb://127.0.0.1:27017/as1"

mongoose.connect(mongodbUrl).
then(() => {
  console.log("Connected to mongodb!")
}).
catch(error => console.log(error));

//Helper function to send a 404 error
function send404(response){
  response.statusCode = 404;
  response.write("Unknown resource.");
  response.end();
}

//Helper function to send a 500 error
function send500(response){
  response.statusCode = 500;
  response.write("Server error.");
  response.end();
}

function params(req){
  let q=req.url.split('?'),result={};
  if(q.length>=2){
    q[1].split('&').forEach((item)=>{
      try {
        result[item.split('=')[0]]=item.split('=')[1];
      } catch (e) {
        result[item.split('=')[0]]='';
      }
    })
  }
  return result;
}

function wordFreq(string) {
  let words = string.replace(/[.]/g, '').split(/\s/);
  let freqMap = {};
  words.forEach(function(w) {
    if (!freqMap[w]) {
      freqMap[w] = 0;
    }
    freqMap[w] += 1;
  });

  return freqMap;
}

const server = http.createServer(async function (request, response) {
  if(request.method === "GET"){
    if(request.url === "/" || request.url === "/index.html"){
      fs.readFile('./pages/index.html', function (err, html) {
        if (err) {
          throw err;
        }
        response.writeHeader(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();
      });
      return;
    } else if(request.url.startsWith("/fruit-detail") || request.url.startsWith("/fruit-detail.html")){
      fs.readFile('./pages/fruit-detail.html', function (err, html) {
        if (err) {
          throw err;
        }
        response.writeHeader(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();
      });
      return;
    } else if(request.url === "/wikipedia" || request.url === "/wikipedia.html"){
      fs.readFile('./pages/personal.html', function (err, html) {
        if (err) {
          throw err;
        }
        response.writeHeader(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();
      });
      return;
    } else if(request.url.startsWith("/wiki-detail") || request.url.startsWith("/wiki-detail.html")){
      fs.readFile('./pages/personal-detail.html', function (err, html) {
        if (err) {
          throw err;
        }
        response.writeHeader(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();
      });
      return;
    } else if(request.url.startsWith("/fruits")){
      try{
        const searchParams = params(request);
        const { q, boost = "true", limit = 10 } = searchParams;
        const queries = q ? q.split(",") : [];
        let data = await Fruit.find({});
        data = data.map(item => ({...item.toObject(), score: 0}));

        if (boost === "true") {
          const index = elasticlunr(function () {
            this.addField('title');
            this.addField('body');
            this.setRef('_id');
          });

          data.forEach(item => index.addDoc(item));
          queries.forEach(query =>{
            const searchResults = index.search(query, {});
            searchResults.forEach(searchResult => {
              const matchedRow = data.find(row => row._id.toString() === searchResult.ref);
              if (matchedRow && (!matchedRow.score || matchedRow.score < searchResult.score)) {
                matchedRow.score = searchResult.score;
              }
            });
          });
        }

        data.sort((a, b) => b.score - a.score)
        data = data.slice(0, Number(limit) > 50 ? 50 : Number(limit))
          .map(item => ({
            id: item._id,
            name: "",
            url: item.link,
            score: item.score,
            title: item.title,
            pr: item.weight,
          }))

        response.statusCode = 200;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify(data));
      }catch(err){
        console.log(err);
        send404(response);
        return;
      }
    } else if(request.url.startsWith("/personal")){
      try{
        const searchParams = params(request);
        const { q, boost = "true", limit = 10 } = searchParams;
        const queries = q ? q.split(",") : [];
        let data = await Wiki.find({});
        data = data.map(item => ({...item.toObject(), score: 0}));

        if (boost === "true") {
          const index = elasticlunr(function () {
            this.addField('title');
            this.addField('body');
            this.setRef('_id');
          });

          data.forEach(item => index.addDoc(item));
          queries.forEach(query =>{
            const searchResults = index.search(query, {});
            searchResults.forEach(searchResult => {
              const matchedRow = data.find(row => row._id.toString() === searchResult.ref);
              if (matchedRow && (!matchedRow.score || matchedRow.score < searchResult.score)) {
                matchedRow.score = searchResult.score;
              }
            });
          });
        }

        data.sort((a, b) => b.score - a.score)
        data = data.slice(0, Number(limit) > 50 ? 50 : Number(limit))
          .map(item => ({
            id: item._id,
            name: "",
            url: item.link,
            score: item.score,
            title: item.title,
            pr: item.weight,
          }))

        response.statusCode = 200;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify(data));
      }catch(err){
        console.log(err);
        send404(response);
        return;
      }
    } else if(request.url.startsWith("/fruitDetail")){
      try{
        const searchParams = params(request);
        const { q } = searchParams;
        let allData = await Fruit.find({});

        let data = await Fruit.findById(q);
        let incomingLinks = allData.filter(item => item.links.includes(data.link)).map(item => item.link);
        let result = {
          id: data._id,
          url: data.link,
          title: data.title,
          incomingLinks: incomingLinks,
          outgoingLinks: data.links,
          wordFrequency: wordFreq(data.body)
        }

        response.statusCode = 200;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify(result));
      }catch(err){
        console.log(err);
        send404(response);
        return;
      }
    } else if(request.url.startsWith("/wikiDetail")){
      try{
        const searchParams = params(request);
        const { q } = searchParams;
        let allData = await Wiki.find({});

        let data = await Wiki.findById(q);
        let incomingLinks = allData.filter(item => item.links.includes(data.link)).map(item => item.link);
        let result = {
          id: data._id,
          url: data.link,
          title: data.title,
          incomingLinks: incomingLinks,
          outgoingLinks: data.links,
          wordFrequency: wordFreq(data.body)
        }

        response.statusCode = 200;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify(result));
      }catch(err){
        console.log(err);
        send404(response);
        return;
      }
    }  else {
      send404(response);
    }
  } else{
    send404(response);
  }
});

//Server listens on port 3000
server.listen(3000);
console.log('Server running at http://localhost:3000/');
