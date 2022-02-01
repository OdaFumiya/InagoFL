const fs = require('fs');
const toDirList = (dir) => {
    const subDirs = fs.readdirSync(dir).map((item) => `${dir}/${item}`).filter((item) => fs.statSync(item).isDirectory())
    if (subDirs.length == 0) {
        return [dir];
    }
    return subDirs.reduce((a, b) => a.concat(toDirList(b)), [dir]);
};
const toFileList = (dir) => {
    return fs.readdirSync(dir).map((item) => `${dir}/${item}`).filter((item) => fs.statSync(item).isFile());
};
const toJSFileList = (dir) => {
    return toFileList(dir).filter((item) => (item.endsWith('.js')));
};

async function makeTestList(argv) {
    const { execSync } = require('child_process');

    var dirs = toDirList(argv.opts().test);
    var files = [];
    dirs.forEach(dir => {
        files = files.concat(toJSFileList(dir));
    });
    var testlistJSON = {};
    for (var i = 0; i < files.length; i++) {
        var buf;
        try {
            const str=fs.readFileSync(files[i] , 'utf-8')
            if (! (str.match(/describe/))){
                continue;
            }
            buf = execSync('node ./node_modules/mocha-list-tests/mocha-list-tests.js ' + files[i])
        } catch (error) {
        }
        if (buf.toString('utf8').slice(0, 1) != '{') {
            var str = buf.toString('utf8');
            for (; str.slice(0, 1) != '{';) {
                str = str.slice(1);
            }
            testlistJSON[files[i]] = JSON.parse(str);
        }
        else {
            testlistJSON[files[i]] = JSON.parse(buf);
        }
    }
    return testlistJSON;
}

async function makeShellscript(testlistJSON) {
    const fs = require('fs');
    let commandlist = [];
    var str = "";
    fs.mkdir('./coverage', (err) => {
        if (err) { }
    });

    for (let i = 0; i < Object.keys(testlistJSON).length; i++) {
        for (let j = 0; j < testlistJSON[Object.keys(testlistJSON)[i]].tests.length; j++) {
            fs.mkdir('./coverage/' + Object.keys(testlistJSON)[i].split('\/').slice(-1)[0] + '_' + j, (err) => {
                if (err) { }
            });

            commandlist.push(
                'c8 --reports-dir ./coverage/' + Object.keys(testlistJSON)[i].split('\/').slice(-1)[0] + '_' + j + ' -r json mocha '
                + Object.keys(testlistJSON)[i]
                + ' --timeout 30000 --reporter json -g \"'
                + testlistJSON[Object.keys(testlistJSON)[i]].tests[j].replace(/\"/g, '\\\"')
                + '\"> ./coverage/' + Object.keys(testlistJSON)[i].split('\/').slice(-1)[0] + '_' + j + '/report.json');
            str += commandlist[commandlist.length -1]+"\n";

        }
    }
    fs.writeFileSync("runalltest.sh", str, (err) => {
        if (err) throw err;
    });
    return commandlist;
}

async function runEachTest(commandlist) {
    const { execSync } = require('child_process');
    for (var i = 0; i < commandlist.length; i++) {
        try {
            console.log(i + "/" + commandlist.length + ":" + commandlist[i]);
            execSync(commandlist[i]);
        } catch (error) {
        }
    }
}

async function parseTestResult(testlistJSON) {
    const fs = require('fs');

    var testresult;
    var testcoverage;
    var testresultJSON = {
        "all": {},
        "fail": {},
        "allnum": {},
        "failnum": {}
    };
    testnum = 0;
    for (let i = 0; i < Object.keys(testlistJSON).length; i++) {
        console.log(i+"/"+Object.keys(testlistJSON).length+":"+Object.keys(testlistJSON)[i])
        for (let j = 0; j < (testlistJSON[Object.keys(testlistJSON)[i]].tests).length; j++) {
            console.log("\t"+j+"/"+(testlistJSON[Object.keys(testlistJSON)[i]].tests).length)
            console.log("./coverage/" + Object.keys(testlistJSON)[i].split('\/').slice(-1)[0] + "_" + j + "/report.json")
            try {
                var resultstr = fs.readFileSync("./coverage/" + Object.keys(testlistJSON)[i].split('\/').slice(-1)[0] + "_" + j + "/report.json", 'utf-8', (err) => {
                    if (err) throw err;
                });
                var coveragestr = fs.readFileSync("./coverage/" + Object.keys(testlistJSON)[i].split('\/').slice(-1)[0] + "_" + j + "/coverage-final.json", 'utf-8', (err) => {
                    if (err) throw err;
                });
            } catch (error) {
                continue;
            }

            if (resultstr.length === 0 || ! (resultstr.match(/{/))) continue;
            if (coveragestr.length === 0 || ! (coveragestr.match(/{/))) continue;
            for (; resultstr.slice(0, 1) != '{';) {
                if (resultstr.length === 0) continue;
                resultstr = resultstr.slice(1);
                //console.log(resultstr)
            }
            for (; coveragestr.slice(0, 1) != '{';) {
                if (coveragestr.length === 0) continue;
                coveragestr = coveragestr.slice(1);
            }
            testresult = JSON.parse(resultstr);
            testcoverage = JSON.parse(coveragestr);
            let srcfileName = Object.keys(testcoverage);
            if(testresult.tests === 0)continue;
            testnum++
            for (let filenum = 0; filenum < srcfileName.length; filenum++) {
                if (srcfileName[filenum] in testresultJSON.all) {
                    for (let k = 0; k < Object.keys(testcoverage[srcfileName[filenum]]['s']).length; k++) {
                        if (testcoverage[srcfileName[filenum]].s[k] != 0) testresultJSON['all'][srcfileName[filenum]].s[k] += 1;
                    }
                    for (let k = 0; k < Object.keys(testcoverage[srcfileName[filenum]]['b']).length; k++) {
                        if (testcoverage[srcfileName[filenum]].b[k] != 0) testresultJSON['all'][srcfileName[filenum]].b[k] += +1;
                    }
                    for (let k = 0; k < Object.keys(testcoverage[srcfileName[filenum]]['f']).length; k++) {
                        if (testcoverage[srcfileName[filenum]].f[k] != 0) testresultJSON['all'][srcfileName[filenum]].f[k] += +1;
                    }
                }
                else {
                    testresultJSON.all[srcfileName[filenum]] = JSON.parse(JSON.stringify(testcoverage[srcfileName[filenum]]));
                    testresultJSON.allnum[srcfileName[filenum]] = 0;
                    for (let k = 0; k < Object.keys(testcoverage[srcfileName[filenum]]['s']).length; k++) {
                        testresultJSON['all'][srcfileName[filenum]].s[k] = 0;
                        if (testcoverage[srcfileName[filenum]].s[k] != 0) testresultJSON['all'][srcfileName[filenum]].s[k] += 1;
                    }
                    for (let k = 0; k < Object.keys(testcoverage[srcfileName[filenum]]['b']).length; k++) {
                        testresultJSON['all'][srcfileName[filenum]].b[k] = 0;
                        if (testcoverage[srcfileName[filenum]].b[k] != 0) testresultJSON['all'][srcfileName[filenum]].b[k] += +1;
                    }
                    for (let k = 0; k < Object.keys(testcoverage[srcfileName[filenum]]['f']).length; k++) {
                        testresultJSON['all'][srcfileName[filenum]].f[k] = 0;
                        if (testcoverage[srcfileName[filenum]].f[k] != 0) testresultJSON['all'][srcfileName[filenum]].f[k] += +1;
                    }
                }
                testresultJSON.allnum[srcfileName[filenum]] += 1;
            }
            if (testresult.stats.failures === 1) {
                for (let j = 0; j < srcfileName.length; j++) {
                    if (srcfileName[j] in testresultJSON.fail) {
                        for (let k = 0; k < Object.keys(testcoverage[srcfileName[j]]['s']).length; k++) {
                            if (testcoverage[srcfileName[j]].s[k] != 0) testresultJSON.fail[srcfileName[j]].s[k] += 1;
                        }
                        for (let k = 0; k < Object.keys(testcoverage[srcfileName[j]]['b']).length; k++) {
                            if (testcoverage[srcfileName[j]].b[k] != 0) testresultJSON.fail[srcfileName[j]].b[k] += +1;
                        }
                        for (let k = 0; k < Object.keys(testcoverage[srcfileName[j]]['f']).length; k++) {
                            if (testcoverage[srcfileName[j]].f[k] != 0) testresultJSON.fail[srcfileName[j]].f[k] += +1;
                        }
                    }
                    else {
                        testresultJSON.fail[srcfileName[j]] = JSON.parse(JSON.stringify(testcoverage[srcfileName[j]]));
                        testresultJSON.failnum[srcfileName[j]] = 0;
                        for (let k = 0; k < Object.keys(testcoverage[srcfileName[j]]['s']).length; k++) {
                            testresultJSON.fail[srcfileName[j]].s[k] = 0;
                            if (testcoverage[srcfileName[j]].s[k] != 0) testresultJSON.fail[srcfileName[j]].s[k] += 1;
                        }
                        for (let k = 0; k < Object.keys(testcoverage[srcfileName[j]]['b']).length; k++) {
                            testresultJSON.fail[srcfileName[j]].b[k] = 0;
                            if (testcoverage[srcfileName[j]].b[k] != 0) testresultJSON.fail[srcfileName[j]].b[k] += +1;
                        }
                        for (let k = 0; k < Object.keys(testcoverage[srcfileName[j]]['f']).length; k++) {
                            testresultJSON.fail[srcfileName[j]].f[k] = 0;
                            if (testcoverage[srcfileName[j]].f[k] != 0) testresultJSON.fail[srcfileName[j]].f[k] += +1;
                        }
                    }
                    testresultJSON.failnum[srcfileName[j]]++;

                }
            }
        }
    }
    return testresultJSON;

}

async function mesureSuspicious(testresultJSON, argv) {
    var suspiciousJSON = {};

    for (let i = 0; i < Object.keys(testresultJSON.all).length; i++) {
        var srcfileName = Object.keys(testresultJSON.all)[i];
        suspiciousJSON[srcfileName] = {};
        var f = new Array(testresultJSON.all[srcfileName]['s']);
        var p = new Array(testresultJSON.all[srcfileName]['s']);
        for (let j = 0; j < Object.keys(testresultJSON.all[srcfileName]['s']).length; j++) {
            f[j] = 0;
            if (srcfileName in testresultJSON.fail) {
                f[j] = testresultJSON.fail[srcfileName].s[j];
            }
            p[j] = testresultJSON.all[srcfileName].s[j];
        }
        if (argv.opts().Ample || argv.opts().all) {
            suspiciousJSON[srcfileName].Ample = mesureAmple(p, f, testresultJSON.allnum[srcfileName], testresultJSON.failnum[srcfileName]);
        }
        if (argv.opts().DStar2 || argv.opts().all) {
            suspiciousJSON[srcfileName].DStar2 = mesureDStar2(p, f, testresultJSON.allnum[srcfileName], testresultJSON.failnum[srcfileName]);
        }
        if (argv.opts().DStar3 || argv.opts().all) {
            suspiciousJSON[srcfileName].DStar3 = mesureDStar3(p, f, testresultJSON.allnum[srcfileName], testresultJSON.failnum[srcfileName]);
        }
        if (argv.opts().DStar10 || argv.opts().all) {
            suspiciousJSON[srcfileName].DStar10 = mesureDStar10(p, f, testresultJSON.allnum[srcfileName], testresultJSON.failnum[srcfileName]);
        }
        if (argv.opts().Jaccard || argv.opts().all) {
            suspiciousJSON[srcfileName].Jaccard = mesureJaccard(p, f, testresultJSON.allnum[srcfileName], testresultJSON.failnum[srcfileName]);
        }
        if (argv.opts().Ochiai || argv.opts().all) {
            suspiciousJSON[srcfileName].Ochiai = mesureOchiai(p, f, testresultJSON.allnum[srcfileName], testresultJSON.failnum[srcfileName]);
        }
        if (argv.opts().Zoltar || argv.opts().all) {
            suspiciousJSON[srcfileName].Zoltar = mesureZoltar(p, f, testresultJSON.allnum[srcfileName], testresultJSON.failnum[srcfileName]);
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

function mesureDStar2(p, f, allnum, failnum) {
    var susp = {};
    for (let i = 0; i < p.length; i++) {
        susp[i] = Math.pow(f[i],2) / (p[i] - f[i] + failnum - f[i]);
    }
    return susp;
}
function mesureDStar3(p, f, allnum, failnum) {
    var susp = {};
    for (let i = 0; i < p.length; i++) {
        susp[i] = Math.pow(f[i],3) / (p[i] - f[i] + failnum - f[i]);
    }
    return susp;
}
function mesureDStar10(p, f, allnum, failnum) {
    var susp = {};
    for (let i = 0; i < p.length; i++) {
        susp[i] = Math.pow(f[i],10) / (p[i] - f[i] + failnum - f[i]);
    }
    return susp;
}

function mesureJaccard(p, f, allnum, failnum) {
    var susp = {};
    for (let i = 0; i < p.length; i++) {
        susp[i] = (p[i] - f[i]) / ((allnum - failnum) + f[i]);
    }
    return susp;
}

function mesureOchiai(p, f, allnum, failnum) {
    var susp = {};
    for (let i = 0; i < p.length; i++) {
        susp[i] = (f[i]) / Math.sqrt(failnum * p[i]);
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


async function main(argv) {
    const fs = require('fs');
    try {
        const testlistJSON = await makeTestList(argv);
        if (argv.opts().list) {
            fs.writeFileSync("testlist.JSON", JSON.stringify(testlistJSON), (err) => {
                if (err) throw err;
            });
        }
        const commandlist = await makeShellscript(testlistJSON);
        if (!argv.opts().skip) {
            await runEachTest(commandlist);
        }
        const testresultJSON = await parseTestResult(testlistJSON);
        if (argv.opts().result) {
            fs.writeFileSync("testresult.JSON", JSON.stringify(testresultJSON), (err) => {
                if (err) throw err;
            });
        }
        const suspiciousJSON = await mesureSuspicious(testresultJSON, argv);
        fs.writeFileSync(argv.opts().name, JSON.stringify(suspiciousJSON), (err) => {
            if (err) throw err;
        });
    }
    catch (err) {

    }
}
module.exports = () => {
    const program = require("commander");
    program
        .version('0.0.1', '-v, --version')
        .option('-a, --all', 'output result measured by all statement.')
        .option('-l, --list', 'output testlist JSON as \'testlist.JSON\'.')
        .option('-n, --name [s]', 'define output file name. default:suspicious.json', "suspicious.json")
        .option('-r, --result', 'output testresult JSON as \'testresult.JSON\'')
        .option('-s, --skip', 'Skip the test and calculate the suspicious value with the existing coverage')
        .option('-t, --test [s]', 'test file location. default:./test', "./test")
        .option('--Ample', 'output result measured by Ample.')
        .option('--DStar2', 'output result measured by DStar(*=2).')
        .option('--DStar3', 'output result measured by DStar(*=3).')
        .option('--DStar10', 'output result measured by DStar(*=10).')
        .option('--Jaccard', 'output result measured by Jaccard.')
        .option('--Ochiai', 'output result measured by Ochiai.')
        .option('--Zoltar', 'output result measured by Zoltar.')
        .parse(process.argv)

    main(program.parse(process.argv));
};