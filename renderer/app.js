const API_BASE = "http://127.0.0.1:8080"

const tabButtons = document.querySelectorAll(".tab-btn");
const panelTitle = document.getElementById("panel-title");

const controlPanels = {
  inference: document.getElementById("controls-inference"),
  plot: document.getElementById("controls-plot"),
  table: document.getElementById("controls-table")
};

const outputPanels = {
  inference: document.getElementById("output-inference"),
  plot: document.getElementById("output-plot"),
  table: document.getElementById("output-table")
};

const titles = {
  inference: "User's Inputs",
  plot: "User's Inputs",
  table: "User's Inputs"
};

function switchTab(tabName) {
  tabButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  Object.keys(controlPanels).forEach(key => {
    controlPanels[key].classList.toggle("hidden", key !== tabName);
    outputPanels[key].classList.toggle("hidden", key !== tabName);
  });

  panelTitle.textContent = titles[tabName];
}

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

async function postJSON(endpoint, body) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  return await response.json();
}

function showError(targetId, message) {
  document.getElementById(targetId).innerHTML = `
    <div class="error-box">${message}</div>
  `;
}

document.getElementById("run-inference-btn").addEventListener("click", runInference);
document.getElementById("run-plot-btn").addEventListener("click", runPlot);
document.getElementById("run-table-btn").addEventListener("click", runTable);

const descriptionBox = document.getElementById("descriptionBox");

descriptionBox.innerHTML = `
  <p>
  This tab helps users to make <strong>statistical conclusions about the composition of negative and positive items in a population</strong>,
  at a selected confidence level (e.g., 95% or 99%) based on observed sample data.
  </p>
  
  <p>
  Here, <strong>population</strong> refers to the complete set of items in the package of interest.
  </p>
  
   <p>
  The <strong>confidence level</strong> represents the degree of certainty associated with the statistical conclusion. 
  For example, a 95% confidence level indicates that, if the same sampling procedure were repeated many times under the same conditions, 
  approximately 95% of the resulting confidence statements would correctly capture the true population composition.
  </p>
  
  <p>
The applicable assumptions for using this method are as follows:<br>
i) Items are sampled randomly from the package one at a time without replacement, where the package consists of a finite number of items.<br>
ii) Each sampled item is characterized as either negative or positive.<br>
iii) All items are assumed to have similar characteristics to ensure fair random sampling. <br>
Based on the observed sample results, the population proportion is then estimated statistically.
</p>

<p>
  To perform the inference, the user specifies a desirable confidence level, and provides 
  the following inputs: the total number of items in population (<strong>N</strong>), the total number of items in sample, 
  (<strong>n</strong>), and the number of negative items observed in the sample (<strong>x</strong>).
</p>

<p>
  Based on these inputs, the app computes <strong>confidence bounds for the composition of negative and positive items within the population</strong> and 
  provides statistically justified conclusions at the selected confidence level.
</p>

<p>
  In other words, this tab is used after a sample has already been collected by 
  drawing a sample of size <strong>n</strong> from the population and 
  recording the number of negative items observed in the sample, denoted by <strong>x</strong>.
</p>

`;

async function runInference() {
  const N = parseInt(document.getElementById("inf_N").value, 10);
  const n = parseInt(document.getElementById("inf_n").value, 10);
  const x = parseInt(document.getElementById("inf_x").value, 10);
  const alpha = parseFloat(document.getElementById("inf_alpha").value);

  const resultBox = document.getElementById("inference_result");
  resultBox.innerHTML = `<p class="muted">Running inference...</p>`;

  try {
    const data = await postJSON("/inference", { N, n, x, alpha });
    if (data.error) {
      showError("inference_result", data.error);
      return;
    }

    const confidencePercent = data.confidence_percent;
    const K = data.K_upper_bound;
    const N_minus_K = data.N_minus_K_upper_bound;
    const K_divided_by_N = (100*data.rounded_up_K_over_N).toFixed(2);
    const one_minus_K_divided_by_N = (100*data.rounded_up_one_minus_K_over_N).toFixed(2);
    

    resultBox.innerHTML = `
      <div class="inference-card">

      <span class="bold_gray">Confidence Level:</span> <strong>${confidencePercent}%<br>
      <span class="bold_gray">Upper Bound on Negatives:</span> <strong>${K} (${K_divided_by_N}%)</strong><br>
      <span class="bold_gray">Lower Bound on Positives:</span> <strong>${N_minus_K} (${one_minus_K_divided_by_N}%)</strong><br><br>

      <span class="bold_gray">Interpretation:</span> With <strong>${confidencePercent}% confidence</strong>, you can say that 
          the number (%) of <strong>negative</strong> items in the population is at most ${K} (${K_divided_by_N}%), and
          the number (%) of <strong>positive</strong> items in the population is at least ${N_minus_K} (${one_minus_K_divided_by_N}%).
          
          
      </div>
      
      
    `;
  } catch (error) {
    showError("inference_result", "Could not connect to the backend. Make sure localhost:8080 is running.");
  }
}

descriptionBoxPlot.innerHTML = `
  <p>
    This tab illustrates <strong>how the achieved confidence level varies with different potential sample sizes</strong>. 
    The evaluation is based on a constraint on the population—namely, an upper bound on the proportion of negative items (<strong>q</strong>)—and 
    the sample-namely, a hypothetical upper bound on the number of negative items in a potential sample (<strong>x₀</strong>). 
  </p>

  <p>
  Here, <strong>population</strong> refers to the complete set of items in the package of interest.
  </p>
  
 <p>
  The <strong>confidence level</strong> represents the degree of certainty associated with the statistical conclusion. 
  For example, a 95% confidence level indicates that, if the same sampling procedure were repeated many times under the same conditions, 
  approximately 95% of the resulting confidence statements would correctly capture the true population composition.
  </p>
  
  
  
  
  <p>
The applicable assumptions for using this method are as follows:<br>
i) Items are sampled randomly from the package one at a time without replacement, where the package consists of a finite number of items.<br>
ii) Each sampled item is characterized as either negative or positive.<br>
iii) All items are assumed to have similar characteristics to ensure fair random sampling. <br>
Based on the observed sample results, the population proportion is then estimated statistically.
</p>


  <p>
    The user provides the following inputs: the population size (<strong>N</strong>), the maximum acceptable proportion of negative items (<strong>q</strong>), 
    and the anticipated maximum number of negative items in a potential sample (<strong>x₀</strong>). 
    The value <strong>x₀</strong> represents a planning assumption about the maximum number of negative items that may be observed in a potential sample.
  </p>

  <p>
    Based on these inputs, the app computes the confidence level that would be achieved for each candidate sample size, 
    assuming that the observed number of negative items is no greater than <strong>x₀</strong>. 
    This allows the user to assess how large a sample is needed to support a desired level of confidence.
  </p>

    <p>
  Note that <strong>q</strong> is treated as a fixed design parameter, not estimated from the data, in order to illustrate how the achieved confidence level varies. 
  Once data are collected, the upper bound on the population proportion of negative items should be inferred at a chosen confidence level 
  using the <strong>Population Inference</strong> tab.
  </p>
`;

async function runPlot() {
  const N = parseInt(document.getElementById("plot_N").value, 10);
  const q = parseFloat(document.getElementById("plot_q").value);
  const m = parseInt(document.getElementById("plot_m").value, 10);

  const status = document.getElementById("plot_status");
  status.textContent = "Generating plot...";

  try {
    const data = await postJSON("/ncalc", { N, q, m });
    console.log("RAW BACKEND RESPONSE:", data);

    if (data.error) {
      status.textContent = "";
      document.getElementById("plot_area").innerHTML = `<div class="error-box">${data.error}</div>`;
      return;
    }

    const x = data.map(row => row.n);
    const y = data.map(row => row.confidence_level);

    Plotly.newPlot(
      "plot_area",
      [
        {
          x: x,
          y: y,
          type: "scatter",
          mode: "markers",
          marker: {
            size: 8,
            color: "#d97706"
          },
          hovertemplate: "n=%{x}<br>Confidence=%{y:.4f}<extra></extra>"
        }
      ],
      {
        margin: { t: 20, r: 20, b: 60, l: 60 },
        xaxis: {
          title: "Potential Sample Size"
        },
        yaxis: {
          automargin: true,
          title: {
            text: "Achieved<br>Confidence Level",
            standoff: 20
          },
          range: [0, 1.1],
          tickvals: [0, 0.25, 0.5, 0.75, 1],
          tickformat: ".2f"
        },
        paper_bgcolor: "#ffffff",
        plot_bgcolor: "#ffffff"
      },
      { responsive: true }
    );

    status.textContent = `Hover over each point to see the achieved confidence level for the corresponding sample size. 
If the observed number of negative items in the sample is no greater than ${m}, the inference would support the conclusion that 
the population proportion of negative items is at most ${q}, at the displayed confidence level.`;
  } catch (error) {
    status.textContent = "";
    document.getElementById("plot_area").innerHTML = `<div class="error-box">Could not connect to the backend. Make sure localhost:8080 is running.</div>`;
  }
}

const descriptionBoxTable = document.getElementById("descriptionBoxTable");

descriptionBoxTable.innerHTML = `
  <p>
    This tab helps determine the <strong>minimum sample size (n₀)</strong> required to achieve a selected confidence level 
    (e.g., 95% or 99%) for making a statistical statement about an upper bound on the proportion of negative items in a population.
    </p>
    
   <p>
  Here, <strong>population</strong> refers to the complete set of items in the package of interest.
  </p>
  
  <p>
  The <strong>confidence level</strong> represents the degree of certainty associated with the statistical conclusion. 
  For example, a 95% confidence level indicates that, if the same sampling procedure were repeated many times under the same conditions, 
  approximately 95% of the resulting confidence statements would correctly capture the true population composition.
  </p>
  
  
  
  <p>
The applicable assumptions for using this method are as follows:<br>
i) Items are sampled randomly from the package one at a time without replacement, where the package consists of a finite number of items.<br>
ii) Each sampled item is characterized as either negative or positive.<br>
iii) All items are assumed to have similar characteristics to ensure fair random sampling. <br>
Based on the observed sample results, the population proportion is then estimated statistically.
</p>
  
  <p>
  The user specifies a desirable confidence level, and 
  provides the following inputs: population size (<strong>N</strong>), the maximum acceptable proportion of negative items (<strong>q</strong>) for the population, and
  the range of hypothetical upper bound on the number of negative items in a potential sample, denoted by <strong>x₀</strong>.
    The value <strong>x₀</strong> represents a planning assumption about the maximum number of negative items that may be observed in a potential sample.
  </p>

    <p>
  Based on these planning inputs, the app determines how large a potential sample must be so that, 
  if the assumed outcome occurs, the resulting inference meets the desired confidence level. 
  The minimum required sample sizes (<strong>n₀</strong>) are presented in a table for each hypothetical upper bound on the number of negative items allowed in a potential sample (<strong>x₀</strong>), 
  along with the corresponding achieved confidence level under this assumption.
</p>

  <p>
    Note that <strong>x₀</strong> is used for planning purposes. After data are collected, statistical conclusions must be based 
    on the observed number of negative items in the sample (<strong>x</strong> in the <strong>Population Inference</strong> tab), not the hypothetical upper bound <strong>x₀</strong>.
  </p>

  <p class="muted">
    To perform the actual statistical inference about population level of negative/positive composition using observed data, please use the <strong>Population Inference</strong> tab.
  </p>
`;

async function runTable() {
  const N = parseInt(document.getElementById("tbl_N").value, 10);
  const q = parseFloat(document.getElementById("tbl_q").value);
  const m_min = parseInt(document.getElementById("tbl_m_min").value, 10);
  const m_max = parseInt(document.getElementById("tbl_m_max").value, 10);
  const alpha = parseFloat(document.getElementById("tbl_alpha").value);
  
  const confidencelevel_percent = (1-alpha)*100;

  const target = document.getElementById("table_result");
  target.innerHTML = `<p class="muted">Building table...</p>`;

  try {
    const data = await postJSON("/table", { N, q, m_min, m_max, alpha });

    if (data.error) {
      showError("table_result", data.error);
      return;
    }

    let html = "";

    if (!data.rows || data.rows.length === 0) {
      html += `<p class="muted">No valid sample sizes were found for the selected inputs.</p>`;
    } else {
      html += `
     <p>
  <strong>How to read each row of the table:</strong>  
  Each row corresponds to the anticipated maximum number of negative items in a sample (<strong>x₀</strong>).
  The table reports the minimum sample size (<strong>n₀</strong>) required so that, if the observed number 
of negative items in the sample is no greater than <strong>x₀</strong>, one can conclude that the population proportion 
of negative items is no greater than <strong>q = ${q}</strong>, with at least <strong>${confidencelevel_percent}%</strong> confidence.
Note that the achieved confidence levels shown in the third column is at least the chosen confidence level.
</p>
        <table class="styled-table">
          <thead>
            <tr>
              <th>Hypothetical upper bound on # of negative items (x₀)</th>
              <th>Required sample size (n₀)</th>
              <th>Achieved confidence level, %</th>
            </tr>
          </thead>
          <tbody>
      `;

      data.rows.forEach(row => {
        const m = row.allowed_no_negatives ?? "";
        const n = row.sample_size ?? "";
        const conf = row.confidence_level == null ? "" : (row.confidence_level*100).toFixed(2);

        html += `
          <tr>
            <td>${m}</td>
            <td>${n}</td>
            <td>${conf}</td>
          </tr>
        `;
      });

      html += `</tbody></table>`;
    }

    if (data.has_infeasible_m) {
      const infeasibleList = data.infeasible_m_values.join(", ");
      html += `
        <p class="muted" style="margin-top: 12px;">
          Note: For some larger allowed numbers of negatives (x₀ = ${infeasibleList}),
          no sample size may achieve the desired constraint q = ${q} at the selected confidence level.
        </p>
      `;
    }

    target.innerHTML = html;
  } catch (error) {
    showError("table_result", "Could not connect to the backend. Make sure localhost:8080 is running.");
  }
}

switchTab("inference");