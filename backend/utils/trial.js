var maxArea = function (height) {
  let left = 0; // left most index
  let right = height.length - 1; // right most index
  let maxWater = 0; //here store the maxWater through iterations

  while (left < right) {
    // to test all the possible
    let width = right - left; // to find the width (distance between two lines)
    let h = Math.min(height[left], height[right]); // (minimum height between 2 lines because that is the max height water can be stored more than that it will be out)
    let currentWater = width * h; // area formed by these 2 lines
    maxWater = Math.max(currentWater, maxWater); // if currentWater greater than the previousMax its getting updated to new max

    if (height[left] < height[right]) {
      // if we increment left even if height of left is larger than right it will be loss in width as hight (smallest of 2 lines here right) still remains the same so area loss
      left++;
    } else {
      right--;
    }
  }

  return maxWater;
};
