console.log("script loaded");

// Store generated matrices
let matrices = [];
let totalTransform = [];

function createTable() {
    console.log("Creating DH input table");
    // generate DH input table
    // Number of joints entered by the user
    const n = parseInt(document.getElementById("jointCount").value);
    const container = document.getElementById("dhInputs");// Container where the table will be inserted

// Start building HTML for the table
    let html = `
        <table>
            <tr>
                <th>θ</th>
                <th>d</th>
                <th>a</th>
                <th>α</th>
            </tr>
        `;

    // add one input row per joint
    for (let i = 0; i < n; i++) {
        html += `
        <tr>
            <td><input id="theta${i}" type="number" value="0"></td>
            <td><input id="d${i}" type="number" value="0"></td>
            <td><input id="a${i}" type="number" value="0"></td>
            <td><input id="alpha${i}" type="number" value="0"></td>
        </tr>
        `;
    }
    html += `
    </table>
    <button onclick="calculate()">Calculate Transformation Matrices</button>
    `;
    container.innerHTML = html;


}

function degToRad(degrees) {
return degrees * Math.PI / 180;
}



function dhTransform(theta, d, a, alpha) {
  /**
* Generates a standard Denavit-Hartenberg transformation matrix.
*
* Parameters:
* theta : Joint angle (radians)
* d : Link offset
* a : Link length
* alpha : Link twist (radians)
*
* Returns:
* 4x4 transformation matrix as a nested array.
*/  
    const ct = Math.cos(theta);
    const st = Math.sin(theta);
    const ca = Math.cos(alpha);
    const sa = Math.sin(alpha);
     
    return [
        [ct, -st * ca, st * sa, a * ct],
        [st, ct * ca, -ct * sa, a * st],
        [0, sa, ca, d],
        [0, 0, 0, 1]
    ]; 



}

function getDHParametersRad(jointCount) {
    /**
     * Reads the DH parameters from the input table and returns them as an array of objects.
     * converts angles from degrees to radians if the RadianToggle checkbox is checked.
    */
    const dhparams = [];
    for (let i = 0; i < jointCount; i++) {
        if (document.getElementById("RadianToggle").checked) {
            dhparams.push({
                theta: degToRad(parseFloat(document.getElementById(`theta${i}`).value)),
                d: parseFloat(document.getElementById(`d${i}`).value),
                a: parseFloat(document.getElementById(`a${i}`).value),
                alpha: degToRad(parseFloat(document.getElementById(`alpha${i}`).value))
            });
        } else {
            dhparams.push({
                theta: parseFloat(document.getElementById(`theta${i}`).value),
                d: parseFloat(document.getElementById(`d${i}`).value),
                a: parseFloat(document.getElementById(`a${i}`).value),
                alpha: parseFloat(document.getElementById(`alpha${i}`).value)
            });
        }
    };
    
    return dhparams;
}

function calculate() {
    // read inputs
    const jointCount = parseInt(document.getElementById("jointCount").value);
    const dhParameters = getDHParametersRad(jointCount);
    
    // reset generated matrices
    matrices = [];
    
    // calculate transforms
    for (const joint of dhParameters) {

        matrices.push(
            dhTransform(
                joint.theta,
                joint.d,
                joint.a,
                joint.alpha
            )
        );
    }

    // calculate total transformation matrix from base to end-effector
    starting_position=
    [[1,0,0,0],
    [0,1,0,0],
    [0,0,1,0],
    [0,0,0,1]
    ];
    totalTransform = matrices.reduce((acc, curr) => multiplyMatrices(acc, curr), starting_position);

    // display results
    const results = document.getElementById("results");
    console.log("Displaying results");
    console.log(results);
    // Clear previous results
    results.innerHTML = "";

    matrices.forEach((matrix, i) => {
        addTable(matrix, `Matrix ${i + 1}`, results);
    });
    addTable(totalTransform, "Total Transformation Matrix", results);


    //add buttons for downloading and copying CSV
    results.insertAdjacentHTML(
        "beforeend",
        `
        <br>
        <button onclick="downloadCSV()">Download matrices as CSV</button>
        <br>
        <button onclick="copyMatricesCSV()">Copy matrices as CSV into clipboard</button>
        `
);

    
    
}

function multiplyMatrices(a, b) {
  return a.map((row, i) =>
    b[0].map((_, j) =>
      row.reduce((sum, _, k) => sum + a[i][k] * b[k][j], 0)
    )
  );
}

//adds a table to the results container
function addTable(matrix, title, result_container) {
  const heading = document.createElement("h3");
  heading.textContent = title;

  const table = document.createElement("table");

  matrix.forEach(row => {
    const tr = document.createElement("tr");

    row.forEach(cell => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });

    table.appendChild(tr);
  });

  result_container.appendChild(heading);
  result_container.appendChild(table);
}

// Convert matrices to CSV format
function matricesToCSV(matrices) {
    csv = "Theta,d,a,alpha\n";
    

  csv+= matrices
    .map((matrix, index) => {
      const rows = matrix.map(row => row.join(",")).join("\n");
      return `A ${index + 1}\n${rows}`;
    })
    .join("\n\n");
    csv+= "\nTotal Transformation Matrix\n";
    csv+= totalTransform.map(row => row.join(",")).join("\n");
  return csv;
}

// Download CSV file
function downloadCSV() {
  const csv = matricesToCSV(matrices);

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "matrices.csv";
  a.click();

  URL.revokeObjectURL(url);
}

async function copyMatricesCSV() {
  const csv = matricesToCSV(matrices);

  try {
    await navigator.clipboard.writeText(csv);
    alert("CSV copied to clipboard!");
  } catch (err) {
    console.error("Failed to copy:", err);
  }
}