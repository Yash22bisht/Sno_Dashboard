// Function to get 'studio' from the URL query parameter
function getStudioFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("studio") || "defaultStudio"; // Fallback to 'defaultStudio' if not provided
}

async function fetchTopupData(studio) {
  const url = `https://app.snookerplus.in/apis/data/topup/${encodeURIComponent(
    studio
  )}`;
  console.log("Fetching data from:", url);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    // console.log('Fetched topup data:', data);

    return data[0];
  } catch (error) {
    console.error("Error fetching topup data:", error);
    return [];
  }
}

function getBusinessDay(date) {
  const ISTOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const ISTDate = new Date(date.getTime() + ISTOffset);
  const hours = ISTDate.getUTCHours();

  if (hours < 6) {
    ISTDate.setUTCDate(ISTDate.getUTCDate() - 1);
  }

  return ISTDate.toISOString().split("T")[0];
}

function groupTopupDataByDate(topupData, month) {
  // console.log("topupData",topupData);

  const groupedData = {};

  topupData.forEach((topup) => {
    if (!topup.RecordDate) {
      console.error("RecordDate is undefined:", "topup");
      return;
    }

    const date = new Date(topup.RecordDate);
    if (isNaN(date.getTime())) {
      console.error("Invalid date:", topup.RecordDate, "Date:", date);
      return;
    }

    const businessDay = getBusinessDay(date);
    const mon = businessDay.split("-")[1];
    if (parseInt(month) === parseInt(mon)) {
        console.log("if")
      const amount = parseFloat(topup.Amount) || 0;

      if (!groupedData[businessDay]) {
        groupedData[businessDay] = { cash: 0, online: 0 };
      }

      const mode = topup.Mode.trim().toLowerCase();
      if (mode === "cash") {
        groupedData[businessDay].cash += amount;
      } else if (mode === "online") {
        groupedData[businessDay].online += amount;
      } else {
        // console.error('Unknown mode:', topup);
      }
    }
    else{
        console.log("else");
        
    }

    
  });

  return groupedData;
}

function populateTopupTable(groupedData, month) {
  const topupTableBody = document.querySelector("#topupTable tbody");
  const totalTopupElem = document.querySelector("#totalTopup");
  const onlineTotalElem = document.querySelector("#onlineTotal");
  const cashTotalElem = document.querySelector("#cashTotal");

  if (!topupTableBody) {
    console.error('Element with ID "topupTable" not found.');
    return;
  }

  topupTableBody.innerHTML = ""; // Clear any existing rows

  let totalTopup = 0;
  let onlineTotal = 0;
  let cashTotal = 0;

  Object.keys(groupedData).forEach((date) => {
    const { cash, online } = groupedData[date];
    const total = cash + online;

    totalTopup += total;
    onlineTotal += online;
    cashTotal += cash;

    const row = topupTableBody.insertRow();
    const dateCell = row.insertCell(0);
    const totalCell = row.insertCell(1);
    const onlineCell = row.insertCell(2);
    const cashCell = row.insertCell(3);

    dateCell.textContent = date;
    totalCell.textContent = total.toFixed(2);
    onlineCell.textContent = online.toFixed(2);
    cashCell.textContent = cash.toFixed(2);
  });

  // Update the summary box
  totalTopupElem.textContent = totalTopup.toFixed(2);
  onlineTotalElem.textContent = onlineTotal.toFixed(2);
  cashTotalElem.textContent = cashTotal.toFixed(2);
}

function filterByDate(groupedData, selectedDate) {
  const selectedDateObj = new Date(selectedDate);
  const businessDay = getBusinessDay(selectedDateObj);

  const filteredData = {};

  if (groupedData[businessDay]) {
    filteredData[businessDay] = groupedData[businessDay];
  } else {
    console.warn(`No data found for business day: ${businessDay}`);
  }

  return filteredData;
}

function setDefaultDate() {
  const dateSelectorTop = document.querySelector("#dateSelectorTop");
  let mon = document.getElementById("month");
  const today = new Date().toISOString().split("T")[0];
  console.log("today", today);
  var currentMonth = today.split("-")[1];
  console.log("currentMonth", currentMonth);
  dateSelectorTop.value = today;
  mon.value = currentMonth;
}

function getMonthName(monthNumber) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Check if the monthNumber is valid (between 1 and 12)
  if (monthNumber < 0 || monthNumber > 12) {
    return "Invalid month number";
  }

  // Return the month name (subtract 1 because arrays are 0-indexed)
  return monthNames[monthNumber - 1];
}

for (let i =1 ; i < 13; i++) {
  const month = getMonthName(i);
  let monthSelect = document.getElementById("month");
  let opt = document.createElement("option");
  opt.value = i;
  opt.innerText = month;
  opt.className = "monthName";
  monthSelect.appendChild(opt);
}

async function init2(topupData) {
  // Get studio name from the URL
  const studio = getStudioFromUrl();
  console.log("Studio:", studio);

  // const topupData = await fetchData("topup",studio);

  // console.log('Data received for processing:', topupData);

  if (!topupData.length) {
    console.error("No data available for processing.");
    return;
  }
  setDefaultDate();

  let mon = document.getElementById("month").value;

  var groupedData = groupTopupDataByDate(topupData,mon);
  console.log("groupedData", groupedData);
  populateTopupTable(groupedData);

  document.getElementById("month").addEventListener("change",(e)=>{
    const selectedMonth = e.target.value;
    console.log("Selected month:", selectedMonth);

    // Re-group the data based on the new month
    groupedData = groupTopupDataByDate(topupData, selectedMonth);
    // console.log("Updated groupedData:", groupedData);

    // Re-populate the table with the new grouped data
    populateTopupTable(groupedData);
    

  })

  document.querySelector("#dateSelectorTop").addEventListener("change", (event) => {
      const selectedDate = event.target.value;
      if (selectedDate) {
        const filteredData = filterByDate(groupedData, selectedDate);
        populateTopupTable(filteredData);
      } else {
        populateTopupTable(groupedData);
      }
    });
}

// window.addEventListener('load', init2);
