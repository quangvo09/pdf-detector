/* eslint strict:"off" */
"use strict";

const { build } = require("./build");
const _ = require("lodash");
const fs = require("fs");

const https = require("https");
const pdfreader = require("pdfreader");

const { files } = require("./files");

async function bufferize(url) {
  var hn = url.substring(url.search("//") + 2);
  hn = hn.substring(0, hn.search("/"));
  var pt = url.substring(url.search("//") + 2);
  pt = pt.substring(pt.search("/"));
  const options = { hostname: hn, port: 443, path: pt, method: "GET" };
  return new Promise(function (resolve, reject) {
    var buff = new Buffer.alloc(0);
    const req = https.request(options, (res) => {
      res.on("data", (d) => {
        buff = Buffer.concat([buff, d]);
      });
      res.on("end", () => {
        resolve(buff);
      });
    });
    req.on("error", (e) => {
      console.error("https request error: " + e);
    });
    req.end();
  });
}

/*
if second param is set then a space ' ' inserted whenever text
chunks are separated by more than xwidth
this helps in situations where words appear separated but
this is because of x coords (there are no spaces between words)

each page is a different array element
*/
async function readlines(buffer, xwidth) {
  return new Promise((resolve, reject) => {
    var pdftxt = new Array();
    var pg = 0;
    new pdfreader.PdfReader().parseBuffer(buffer, function (err, item) {
      if (err) console.log("pdf reader error: " + err);
      else if (!item) {
        pdftxt.forEach(function (a, idx) {
          pdftxt[idx].forEach(function (v, i) {
            pdftxt[idx][i].splice(1, 2);
          });
        });
        resolve(pdftxt);
      } else if (item && item.page) {
        pg = item.page - 1;
        pdftxt[pg] = [];
      } else if (item.text) {
        var t = 0;
        var sp = "";
        pdftxt[pg].forEach(function (val, idx) {
          if (val[1] == item.y) {
            if (xwidth && item.x - val[2] > xwidth) {
              sp += " ";
            } else {
              sp = "";
            }
            pdftxt[pg][idx][0] += sp + item.text;
            t = 1;
          }
        });
        if (t == 0) {
          pdftxt[pg].push([item.text, item.y, item.x]);
        }
      }
    });
  });
}

const invalidUrls = [];

const validate = async (url) => {
  var buffer = await bufferize(url);
  var lines = await readlines(buffer);
  lines = await JSON.parse(JSON.stringify(lines));
  const text = _.flattenDeep(lines).join("");

  // Detect text in the pdf file
  if (text.indexOf("TÃªn") >= 0) {
    console.log(url);
    fs.appendFileSync("result.txt", url + "\n");
    invalidUrls.push(url);
  }
};

async function start() {
  const app = build({ logger: true });
  try {
    await app.listen(8080);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

async function main() {
  for (let label of files) {
    console.log("🚀 ~ file: start.js ~ line 109 ~ main ~ label", label);
    await validate(label);
  }

  console.log(invalidUrls);
}

if (require.main === module) {
  start();
  main();
}
