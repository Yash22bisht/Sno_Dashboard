async function fetchData(table, studio) {
  const url = `apis/data/${table}/${studio}`;
  const response = await fetch(url);
  const data = await response.json();
  return data[0];
}

function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

async function createTableWisePerformanceGraph() {
  const clubName = getParameterByName("clubname");
  const studio = getParameterByName("studio");
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
