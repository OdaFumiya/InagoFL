var assert = require('assert');
var FizzBuzz = require('../fb.js');

describe('Mocha test example', function() {

  beforeEach(() => {
    // nothing to do.
  });
  
  describe('input 3', () => {
    it('input 3', () => {
      assert.deepEqual(FizzBuzz.FizzBuzz(3), "f");
    });
  });
  describe('input 5', () => {
    it('input 5', () => {
      assert.deepEqual(FizzBuzz.FizzBuzz(5), "b");
    });
  });
  describe('input 15', () => {
    it('input 15', () => {
      assert.deepEqual(FizzBuzz.FizzBuzz(15), "fb");
    });
  });
});

