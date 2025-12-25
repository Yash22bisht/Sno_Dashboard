async function fetchData(table, studio) {
  const url = ` https://app.snookerplus.in/apis/data/${table}/${studio}`;
  const response = await fetch(url);
  const data = await response.json();
  return data[0];
}

function getParameterByNameSt(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

async function createTableWisePerformanceGraph() {
  //const clubName = getParameterByNameSt("clubname");
  const studio = getParameterByNameSt("studio")?.replace(/_/g, ' ');
  const data = await fetchData("tabledets", studio);
  console.log(data);

  const tables = data.map((row) => row.table_id);
  console.log(tables);
  const occupancy = data.map((row) => row.total_duration);
  const tableStatus = data.map((row) => row.status);
  console.log("tableStatus", tableStatus);

  // Set bar colors based on table status
  const barColors = tableStatus.map((status) =>
    status === 1 ? "#01AB7A" : "#CCCCCC"
  );
  console.log(barColors);

  createGraph(
    occupancy,
    tables,
    "tableWisePerformanceChart",
    "Table's Performance",
    barColors
  );
}


function createGraph(data, labels, canvasId, graphTitle, backgroundColors) {
  var ctx = document.getElementById(canvasId).getContext("2d");
  var myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: graphTitle,
          data: data,
          backgroundColor: backgroundColors || "#01AB7A", // Use provided colors or default color
          borderColor: "#018a5e",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          display: canvasId !== "dateWisePerformanceChart", // Hide axis for 'dateWisePerformanceChart'
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: function (context) {
              return `Details for ${labels[context[0].dataIndex]}`;
            },
          },
        },
      },
      title: {
        display: true,
        text: graphTitle,
        font: {
          size: 18,
          weight: "bold",
        },
        color: "#01AB7A",
      },
    },
  });
}

createTableWisePerformanceGraph();
