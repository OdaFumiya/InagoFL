npm install c8
npm install mocha
npm install --save-dev mocha-list-tests
mkdir coverage
node ./node_modules/mocha-list-tests/mocha-list-tests.js ./test > "./coverage/testlist.json"
node getEachTestCoverage.js
./runEachTest.sh
node fl.js
read -p "Hit enter: "