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
