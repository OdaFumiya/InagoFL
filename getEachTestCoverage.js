const fs = require('fs');


function isEmpty(obj) {
  return !Object.keys(obj).length
}
function getEachTestCoverage() {
  fs.readFile('./coverage/testlist.json', 'utf-8', (err, files) => {
    if (err) { throw err; }
    var str = files;
    var output = "";
    const testList = JSON.parse(str);
    for (let i = 0; i < Object.keys(testList.tests).length; i++) {
      output += 'c8 -r json mocha --reporter json -g \'' + testList.tests[i] + '\' > "./coverage/testresult-' + testList.tests[i] + '.json"\n';
      output += 'mv -f ./coverage/coverage-final.json "./coverage/coverage-' + testList.tests[i] + '.json"\n';
    }
    fs.writeFile("./runEachTest.sh", output, (err) => {
      if (err) throw err;
    });
  });
}
getEachTestCoverage();