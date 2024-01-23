const { Matrix } = require("ml-matrix");

const alpha = 0.1;
const diff = 0.0001;

// Generate the matrix
function generateMatrix(rows){

  // matrix's row and column
  let matrixRnC = rows.length;
  let dataMatrix = [];

  for (let i=0; i< matrixRnC; i++){
    let row = [];

    for (let j = 0; j < matrixRnC; j++) {
      // Find the column link
      const matchedLink = rows[i].links.find(link => link === rows[j].link);
      if (matchedLink)
      {
        row.push(1 / rows[i].links.length);
      }
      else
      {
        row.push(0);
      }
    }

    dataMatrix.push(row);
  }


  // Hate to name everything
  dataMatrix = new Matrix(dataMatrix);
  return dataMatrix;
}

const euclidean = (a, b) => {
  let r = a.sub(b);
  return r.norm();
}

// Calculate the final probability matrix
// matrix here should be a NxN probability matrix of each outgoing link
function calculateMatrix(matrix){
  // n is length
  let n = matrix.rows;

  // Transition probability
  let resultMatrix = matrix.mul(1-alpha);

  // Teleport probability
  let tpProbabilityMatrix = Matrix.ones(n, n);
  tpProbabilityMatrix = tpProbabilityMatrix.mul(alpha/n);

  // Sum them up
  let finalResultMatrix = Matrix.add(resultMatrix, tpProbabilityMatrix);

  return finalResultMatrix;
}

// Calculate the page rank
// matrix here should be a NxN probability matrix that includes all possible outcome including teleport
function nPIEPIteration(matrix){
  // n is length
  let n = matrix.rows;
  //Initial PageRank vector
  // x0 will be[[1,0,0,0,...,0]]
  let x0 = new Matrix(1, n);
  x0.set(0, 0, 1);

  // Iterate euclidean distance calculation
  while(true){
    let x1 = x0.mmul(matrix);
    let edistance = euclidean(x0,x1);
    if (edistance < diff){
      // Should return the result and leave
      return x1
    }
    x0 = x1;
  }
}

module.exports = {
  generateMatrix,
  calculateMatrix,
  nPIEPIteration
}

