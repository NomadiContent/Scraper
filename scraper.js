const fs = require('fs');
//content scraping library
const osmosis = require('osmosis');
//json to csv conversion library
const json2csv = require('json2csv');
const http = require('http');

//establish date and time
let nowTime = new Date();
let nowDate = (nowTime.toString().slice(4,15));
let savedData = [];

//function to print error messages
function printError(error){
  console.error(error.message);
}

//scrape data from endpoints using 'osmosis' package
function scrape() {
  try {
    osmosis
        .get('http://www.shirts4mike.com/shirts.php')
        .find('.products li a')
        .set({
          'url': '@href',
        })
        .follow('@href')
        .set({
          'title': 'title',
          'price': '.price',
          'imgurl': 'img @src'
        })
        .data(function(data) {
            savedData.push(data);
        })
        .done(function() {
            //when all actions are completed add 'time' to savedData object
            for (i in savedData) {
              savedData[i]['time'] = nowTime.toString();
            }
            //format savedData as a JSON object and reorder headers/data
            JSON.stringify(savedData, ['title','price','imgurl','url','time'], 4);
            json2csv({data: savedData, fields: ['title', 'price', 'imgurl','url','time']}, function(err, csv) {
              //write savedData object to a file
              fs.writeFile(`data/${nowDate}.csv`, csv, function(err) {
                if (err) throw err;
              console.log('file saved');
            });
          });
        });
      } catch (error) {
        printError(error);
      }
}
//create data folder if it doesn't alread exist
try {
  if (fs.existsSync('data') == false)   {
    fs.mkdirSync('data');
  }
} catch (err) {
  console.lgo('there was an error');
}

//make a get request to ensure that the endpoint used in the scraper is available
function getData() {
  try {
  const request = http.get('http://www.shirts4mike.com/shirts.php',response => {
    //proceed only if status of website is 'ok'
    if (response.statusCode === 200) {
      //call scraper
      scrape();
    } else {
      //log error message from endpoint if status code is not 'ok'
      const message = `There was an error: ${http.STATUS_CODES[response.statusCode]}`
      const statusCodeError = new Error(message);
      fs.appendFileSync('data/scraper-error.log', `${nowTime} ${statusCodeError} \r\n`);
      printError(statusCodeError);
    }
  });
    request.on('error', printError)
  } catch (error) {
    printError(error);
  }
}
//call function
getData();
