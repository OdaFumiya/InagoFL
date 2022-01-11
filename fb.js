FizzBuzz = n => {
    var s;
    if (n % 15 == 0) {
         s = "fb"; //Buggy
        }
    if (n % 3 == 0) {
         s="f"; 
        }
    if (n % 5 == 0){
         s = "b";
        }
    return s;
  }
  exports.FizzBuzz = FizzBuzz;