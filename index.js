import moment from 'moment';
import prices from './data.js';



// define a crash as a drop in 20% or more from the last maximum
// determine bottom as recovery is +x% from bottom(for example, we can say x = 5 and so if local minimum is 5% less than current value we are likely out of the crash and wont recrash. Figure out what X should be.)
/* Failure modes:
 * Fail if detect a crash within 5 years of another
 * we will typically be investing once we start recovering. Failure if we invest too late(ie. we are x% above the current bottom)
 *
 *
 *
 */

const crashpct = .2;
const recoverypct = .11;
const investingLatenesspct = .1;
// number of years before we allow a crash, for example if we get 2 crashes within a year we likely have a false positive since the market cannot recover that quickly
const lastCrashLimit = 5;

let startDate = moment('1980-01-01');
let endDate = moment('2018=01-01');
//startDate = null;
endDate = null;

let filteredPrices;
if (startDate && endDate) {
  filteredPrices = prices.filter(x => moment(x.date).isAfter(startDate) && moment(x.date).isBefore(endDate));
} else if (startDate) {
  filteredPrices = prices.filter(x => moment(x.date).isAfter(startDate));
} else if (endDate) {
  filteredPrices = prices.filter(x => moment(x.date).isBefore(endDate));
} else {
  filteredPrices = prices;
}

findCrashes(crashpct, recoverypct);


function findCrashes(crashpct, recoverypct) {
  let testFailed = false;
  let currentMax = 0;
  let isCrashing = false;
  let currentBottom = 0;
  let lastCrash = null;
  for (let price of filteredPrices) {
    if (price.price > currentMax) {
      currentMax = price.price;
    }

    // crashing logic
    if (currentMax * (1 - crashpct) > price.price) {
      let isNewCrash = !isCrashing;
      isCrashing = true;
      if (isNewCrash || currentBottom > price.price) {
        currentBottom = price.price;
      }
      if (isNewCrash) {
        console.log(`we have a crash on ${price.date} at $${price.price}: LAST MAX = $${currentMax}`);
      }

      // check if this crash is within x years of last crash, if so, our test fails
      let lastCrashClone = lastCrash && lastCrash.clone();
      if (isNewCrash && lastCrashClone && lastCrashClone.add(lastCrashLimit, 'years').isAfter(moment(price.date))) {
        console.log('FAILED TEST!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log('FAILED TEST!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log(`crashpct: ${crashpct} recoverypct: ${recoverypct}       !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
        console.log('FAILED TEST!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log('FAILED TEST!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        findCrashes(crashpct, recoverypct + .01);
        testFailed = true;
        break;
      }
      lastCrash = moment(price.date);
    }

    // recovering logic
    if (currentBottom * (1 + recoverypct) < price.price && isCrashing) {
      isCrashing = false;
      currentMax = price.price;
      let pctFromBottom = Math.round(100 * price.price / currentBottom) / 100;
      console.log(`we started recovering on ${price.date} at $${price.price}: LAST BOTTOM $${currentBottom} PCT from bottom(${pctFromBottom})`);

    }
  }

  if (!testFailed) {
    console.log(`COMPLETED TEST AT crashpct: ${crashpct} recoverypct: ${recoverypct}`);
  }
}
