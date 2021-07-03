### TO DETECT THE TEXT IN THE PDF FILE

1. Run `yarn` to install libs
2. Input `files` in the `files.js`
3. Change `text` to detect in the `start.js`

```
  // Detect text in the pdf file
  if (text.indexOf("TÃªn") >= 0) {
    console.log(url);
    fs.appendFileSync("result.txt", url + "\n");
    invalidUrls.push(url);
  }
```

4. Run `yarn src/start.js` the result will be written in the `result.txt`
