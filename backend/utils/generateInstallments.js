function generateInstallments(total, count = 3) {
  count = Math.max(1, Math.min(count, 12));
  if (count === 1) {
    // Single instalment, round to nearest 100
    let amt = Math.round(total);
    let last2 = amt % 100;
    if (last2 < 50) {
      amt = amt - last2;
    } else {
      amt = amt + (100 - last2);
    }
    return [{ amount: amt }];
  }
  // 1st instalment
  let normal = total / count;
  let first = normal + 2000;
  first = Math.round(first);
  let last2 = first % 100;
  if (last2 < 50) {
    first = first - last2;
  } else {
    first = first + (100 - last2);
  }
  // Baaki amount
  let restAmount = total - first;
  let restCount = count - 1;
  let eachRest = restAmount / restCount;
  let installments = [{ amount: first }];
  let sum = first;
  for (let i = 1; i < count; i++) {
    let amt = eachRest;
    let last2 = amt % 100;
    if (last2 < 50) {
      amt = amt - last2;
    } else {
      amt = amt + (100 - last2);
    }
    amt = Math.round(amt);
    installments.push({ amount: amt });
    sum += amt;
  }
  // Adjustment in last instalment
  let diff = total - sum;
  installments[installments.length - 1].amount += diff;
  // Last instalment ko bhi 100 pe round karo
  let lastAmt = installments[installments.length - 1].amount;
  let last2last = lastAmt % 100;
  if (last2last < 50) {
    lastAmt = lastAmt - last2last;
  } else {
    lastAmt = lastAmt + (100 - last2last);
  }
  installments[installments.length - 1].amount = lastAmt;
  // Final adjustment if rounding ne total bigaad diya
  let finalSum = installments.reduce((a, b) => a + b.amount, 0);
  if (finalSum !== total) {
    installments[installments.length - 1].amount += (total - finalSum);
  }
  return installments;
}

export default generateInstallments; 