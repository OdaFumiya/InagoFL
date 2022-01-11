const fs = require('fs');


function isEmpty(obj) {
  return !Object.keys(obj).length
}

fs.readFile('./coverage/testlist.json', 'utf-8', (err, files) => {
  if (err) { throw err; }
  var str = files;
  const testList = JSON.parse(str);
  var testresult;
  var testcoverage;
  var AllTestJSON = {};
  var FailedTestJSON = {};
  var failnum = 0;
  for (let i = 0; i < Object.keys(testList.tests).length; i++) {
    console.log('./coverage/coverage-' + testList.tests[i] + '.json reading');

    testresult = JSON.parse(fs.readFileSync('./coverage/testresult-' + testList.tests[i] + '.json', 'utf8'));
    testcoverage = JSON.parse(fs.readFileSync('./coverage/coverage-' + testList.tests[i] + '.json', 'utf8'));

    var srcfileName = Object.keys(testcoverage);
    for (let j = 0; j < srcfileName.length; j++) {
      if (!(srcfileName[j] in AllTestJSON)) {
        AllTestJSON[srcfileName[j]] = testcoverage[srcfileName[j]];
      }
      else {
        for (let k = 0; k < Object.keys(testcoverage[srcfileName[j]]['s']).length; k++) {
          AllTestJSON[srcfileName[j]].s[k] += testcoverage[srcfileName[j]].s[k];
        }
      }
    }
    if (testresult.stats.passes === 0) {
      failnum++;
      
      for (let j = 0; j < srcfileName.length; j++) {
        if (!(srcfileName[j] in FailedTestJSON)) {
          FailedTestJSON[srcfileName[j]] = testcoverage[srcfileName[j]];
        }
        else {
          for (let k = 0; k < Object.keys(testcoverage[srcfileName[j]]['s']).length; k++) {
            FailedTestJSON[srcfileName[j]].s[k] += testcoverage[srcfileName[j]].s[k];
          }
        }
      }
    }
  }
  var srcfileName = Object.keys(AllTestJSON);
  for (let j = 0; j < srcfileName.length; j++) {
    console.log(srcfileName[j]);
    for (let i = 0; i < Object.keys(AllTestJSON[srcfileName[j]]['s']).length; i++) {
      console.log("[" + i + "]:" + (FailedTestJSON[srcfileName[j]].s[i] / Math.sqrt(failnum * AllTestJSON[srcfileName[j]].s[i])));
    }
  }
});