const fs = require('fs');
//using cheerio to traverse dom
const cheerio = require('cheerio');

//using request to simplify getting the HTML document body
const request = require('request')
//json to csv conversion library
const json2csv = require('json2csv');
const http = require('http');

//establish date and time and arrays for holding shit info
let nowTime = new Date();
let nowDate = new Date().toISOString().substr(0,10);
let links = [];
let dataSet = [];

const fields = ['title', 'price', 'imageURL','url','time'];


//create data folder if it doesn't alread exist
try {
  if (fs.existsSync('data') == false)   {
    fs.mkdirSync('data');
  }
} catch (err) {
  console.log('there was an error');
}


//function to scrape data
function scrape() {

  //find product links
  request('http://www.shirts4mike.com/shirts.php', function (error, response, body) {

     if (error || response.statusCode !== 200) {
          const errorMessage = error.message + "failed to connect to shirts4mike"
          fs.appendFileSync('data/scraper-error.log', `${nowTime} ${errorMessage} \r\n`);
          console.log(errorMessage);
          return 'error';
      }

      let $ = cheerio.load(body);
      const products = ($('.products li a'));

      //pull details of products
      for (var i = 0; i <= products.length - 1; i++) {
        let site = 'http://shirts4mike.com/' + (cheerio(products[i]).attr('href'));
        request(site, function(error, response, linkBody){

          if (error || response.statusCode !== 200) {
               const errorMessage = error.message + " failed to connect to shirts4mike, individual shirts page"
               fs.appendFileSync('data/scraper-error.log', `${nowTime} ${errorMessage} \r\n`);
               console.log(errorMessage);
               return 'error';
           }

          $ = cheerio.load(linkBody)
          let title = $('title').text();
          let imageURL = $('.shirt-picture img').attr('src');
          let price = $('.price').text();
          let url = response.request.uri.href;
          let time = nowTime.toString();
          dataSet.push({title, price, imageURL, url, time});

          //write products to datafile
          if (dataSet.length === products.length) {
            var csv = json2csv({ data: dataSet, fields: fields });
            fs.writeFile(`data/${nowDate}.csv`, csv, function(err) {
              if (err) throw err;
              console.log('file saved');
            });
          }
        });
      }
  });
}

//execute scraping function
scrape();
