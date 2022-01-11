const fs = require('fs');


function isEmpty(obj) {
  return !Object.keys(obj).length
}

function getCoverageAndMakeTest() {
  fs.readFile('./coverage/testresult.json', 'utf-8', (err, files) => {
    if (err) { throw err; }
    var str = files
    while (str.indexOf('{') != 0) {
      str = str.slice(1);
    }
    while (str.lastIndexOf('}') != str.length - 1) {
      str = str.slice(0, -1);
    }
    const allTestResult = JSON.parse(str);
    const allTestCoverage = JSON.parse(fs.readFileSync('./coverage/coverage-final.json', 'utf8'));
    const testBackup = fs.readFileSync('./test.js', 'utf8');
    var onlyFailTest = testBackup;
    fs.writeFile("./coverage/testbackup.js", testBackup, (err) => {
      if (err) throw err;
    });
    fs.writeFile("./coverage/alltestresult.json", JSON.stringify(allTestResult), (err) => {
      if (err) throw err;
    });
    fs.writeFile("./coverage/alltestcoverage.json", JSON.stringify(allTestCoverage), (err) => {
      if (err) throw err;
    });
    for (let i = 0; i < allTestResult.stats.tests; i++) {
      if (isEmpty(allTestResult.tests[i].err)) {
        onlyFailTest = onlyFailTest.replace("it(", "it.skip(");
      }
      else { onlyFailTest = onlyFailTest.replace("it(", "it.only("); }
    }
    console.log(onlyFailTest);
    fs.writeFile("./test.js", onlyFailTest, (err) => {
      if (err) throw err;
    });
  });
}

getCoverageAndMakeTest();