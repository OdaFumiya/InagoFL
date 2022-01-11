


function makeTestList() {
    const { execSync } = require('child_process');
    const testlistJSON = execSync('node ./node_modules/mocha-list-tests/mocha-list-tests.js ./test');
    return testlistJSON;
}

function makeShellscript(testlistJSON) {
    const fs = require('fs');
    let commandlist = [];
    const testList = JSON.parse(testlistJSON);
    for (let i = 0; i < Object.keys(testList.tests).length; i++) {
        commandlist.push('c8 -r json mocha --reporter json -g \"' + testList.tests[i] + '\" > "./coverage/testresult-' + testList.tests[i] + '.json"');
        commandlist.push('mv -f ./coverage/coverage-final.json "./coverage/coverage-' + testList.tests[i] + '.json"');
    }
    return commandlist;
}

function runEachTest(commandlist) {
    const { execSync } = require('child_process');
    commandlist.forEach(element => {
        try {
            execSync(element);
        } catch (error) {
        }
    });
}

function parseTestResult(testlistJSON) {
    const fs = require('fs');
    var str = testlistJSON;
    const testList = JSON.parse(str);
    var testresult;
    var testcoverage;
    var testresultJSON = {
        "all": [],
        "fail": [],
        "allnum": 0,
        "failnum": 0
    };
    for (let i = 0; i < Object.keys(testList.tests).length; i++) {
        testresult = JSON.parse(fs.readFileSync('./coverage/testresult-' + testList.tests[i] + '.json', 'utf8'));
        testcoverage = JSON.parse(fs.readFileSync('./coverage/coverage-' + testList.tests[i] + '.json', 'utf8'));

        var srcfileName = Object.keys(testcoverage);
        for (let j = 0; j < srcfileName.length; j++) {
            b = true;
            testresultJSON.all.forEach(element => {
                if (srcfileName[j] in element) {
                    for (let k = 0; k < Object.keys(testcoverage[srcfileName[j]]['s']).length; k++) {
                        element[srcfileName[j]].s[k] += testcoverage[srcfileName[j]].s[k];
                    }
                    for (let k = 0; k < Object.keys(testcoverage[srcfileName[j]]['b']).length; k++) {
                        element[srcfileName[j]].b[k] += testcoverage[srcfileName[j]].b[k];
                    }
                    for (let k = 0; k < Object.keys(testcoverage[srcfileName[j]]['f']).length; k++) {
                        element[srcfileName[j]].f[k] += testcoverage[srcfileName[j]].f[k];
                    }
                    b = false;
                }
            });
            if (b) {
                testresultJSON.all.push(testcoverage)
            }
            testresultJSON.allnum++;
        }
        if (testresult.stats.passes === 0) {
            for (let j = 0; j < srcfileName.length; j++) {
                b = true;
                testresultJSON.fail.forEach(element => {
                    if (srcfileName[j] in element) {
                        for (let k = 0; k < Object.keys(testcoverage[srcfileName[j]]['s']).length; k++) {
                            element[srcfileName[j]].s[k] += testcoverage[srcfileName[j]].s[k];
                        }
                        for (let k = 0; k < Object.keys(testcoverage[srcfileName[j]]['b']).length; k++) {
                            element[srcfileName[j]].b[k] += testcoverage[srcfileName[j]].b[k];
                        }
                        for (let k = 0; k < Object.keys(testcoverage[srcfileName[j]]['f']).length; k++) {
                            element[srcfileName[j]].f[k] += testcoverage[srcfileName[j]].f[k];
                        }
                        b = false;
                    }
                });
                if (b) {
                    testresultJSON.fail.push(testcoverage)
                }
                testresultJSON.failnum++;
            }
        }
    }

    return testresultJSON;

}

function mesureSuspicious(testresultJSON) {
    var suspiciousJSON = {};

    for (let i = 0; i < testresultJSON.all.length; i++) {
        var srcfileName = Object.keys(testresultJSON.all[i])[0];
        suspiciousJSON[srcfileName] = {};
        var f = new Array(testresultJSON.all[i][srcfileName]['s']);
        var p = new Array(testresultJSON.all[i][srcfileName]['s']);
        for (let j = 0; j < Object.keys(testresultJSON.all[i][srcfileName]['s']).length; j++) {
            f[j] = 0;
            for (let k = 0; k < testresultJSON.fail.length; k++) {
                if (srcfileName in testresultJSON.fail[k]) {
                    f[j] = testresultJSON.fail[k][srcfileName].s[j];
                }
            }
            p[j] = testresultJSON.all[i][srcfileName].s[j];
        }
        if (program.opts().Ample || program.opts().all) {
            suspiciousJSON[srcfileName].Ample = mesureAmple(p, f, testresultJSON.allnum, testresultJSON.failnum);
        }
        if (program.opts().Jaccard || program.opts().all) {
            suspiciousJSON[srcfileName].Jaccard = mesureJaccard(p, f, testresultJSON.allnum, testresultJSON.failnum);
        }
        if (program.opts().Ochiai || program.opts().all) {
            suspiciousJSON[srcfileName].Ochiai = mesureOchiai(p, f, testresultJSON.allnum, testresultJSON.failnum);
        }
        if (program.opts().Zoltar || program.opts().all) {
            suspiciousJSON[srcfileName].Zoltar = mesureZoltar(p, f, testresultJSON.allnum, testresultJSON.failnum);
        }
    }
    return suspiciousJSON;
}

function mesureAmple(p, f, allnum, failnum) {
    var susp = {};
    for (let i = 0; i < p.length; i++) {
        susp[i] = Math.abs(f[i] / failnum - (p[i] - f[i]) / (allnum - failnum));
    }
    return susp;
}

function mesureJaccard(p, f, allnum, failnum) {
    var susp = {};
    for (let i = 0; i < p.length; i++) {
        susp[i] = f[i] / (failnum + p[i] - f[i]);
    }
    return susp;
}

function mesureOchiai(p, f, allnum, failnum) {
    var susp = {};
    for (let i = 0; i < p.length; i++) {
        susp[i] = f[i] / Math.sqrt(failnum * p[i]);
    }
    return susp;
}

function mesureZoltar(p, f, allnum, failnum) {
    var susp = {};
    for (let i = 0; i < p.length; i++) {
        susp[i] = f[i] / (failnum + p[i] - f[i] + 100000 * (failnum - f[i]) * (p[i] - f[i]) / f[i]);
    }
    return susp;
}




function main(argv) {
    const fs = require('fs');
    const testlistJSON = makeTestList();
    const commandlist = makeShellscript(testlistJSON);
    runEachTest(commandlist);
    const testresultJSON = parseTestResult(testlistJSON);
    const suspiciousJSON = mesureSuspicious(testresultJSON);
    fs.writeFile(program.opts().name, JSON.stringify(suspiciousJSON), (err) => {
        if (err) throw err;
    });
}
module.exports = () => {
    const program = require("commander");
    program
        .version('0.0.1', '-v, --version')
        .option('-a, --all', 'output result measured by all statement.')
        .option('-l, --list', 'output testlist JSON as \'testlist.JSON\'.')
        .option('-n, --name [s]', 'define output file name. default:suspicious.json', "suspicious.json")
        .option('-r, --result', 'output testresult JSON as \'testresult.JSON\'')
        .option('--Ample', 'output result measured by Ample.')
        .option('--Jaccard', 'output result measured by Jaccard.')
        .option('--Ochiai', 'output result measured by Ochiai.')
        .option('--Zoltar', 'output result measured by Zoltar.')
        .parse(process.argv)

    main(program.parse(process.argv));
    module.exports = {
        sayHello: () => {
            console.log('Hello World');
        }
    };
};