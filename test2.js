var assert = require('assert');
var ctz = require('../ctz.js');

describe('Mocha test example', function() {

  beforeEach(() => {
    // nothing to do.
  });
  
  describe('testSort01', () => {
    it('positive number 0', () => {
      assert.deepEqual(ctz.ctz(100), 99);
    });
    
    it('positive number 1', () => {
      assert.deepEqual(ctz.ctz(1), 0);
    });
    
    it('negative number 0', () => {
      assert.deepEqual(ctz.ctz(-100), -99);
    });
    
    it('negative number 1', () => {
      assert.deepEqual(ctz.ctz(-1), 0);
    });
    
    it('zero 0', () => {
      assert.deepEqual(ctz.ctz(0), 0);
    });

  });
});

