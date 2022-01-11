var assert = require('assert');
var ctz = require('../ctz.js');

describe('Mocha test example', function() {

  beforeEach(() => {
    // nothing to do.
  });
  
  describe('positive number 0', () => {
    it('positive number', () => {
      assert.deepEqual(ctz.ctz(100), 99);
    });
  });
  describe('positive number 1', () => {
    it('positive number', () => {
      assert.deepEqual(ctz.ctz(1), 0);
    });
  });
  describe('negative number 0', () => {
    it('negative number', () => {
      assert.deepEqual(ctz.ctz(-100), -99);
    });
  });
  describe('negative number 1', () => {
    it('negative number', () => {
      assert.deepEqual(ctz.ctz(-1), 0);
    });
  });
  describe('zero 0', () => {
    it('zero', () => {
      assert.deepEqual(ctz.ctz(0), 0);
    });
  });
});
