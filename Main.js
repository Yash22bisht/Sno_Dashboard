// Helper function to get URL parameters
function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`, "i");
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// async function fetchData1(table, Studio) {
//     const url = `https://app.snookerplus.in/apis/data/${table}/${encodeURIComponent(Studio)}`;
//     console.log('Fetching data from:', url);

//     try {
//         const response = await fetch(url);

//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }

//         const data = await response.json();
//         // console.log('Fetched data:', data);

//         return data[0];  // Flatten the nested arrays into a single array
//     } catch (error) {
//         console.error('Error fetching data:', error);
//         return []; // Return an empty array or handle the error as needed
//     }
// }

// async function fetchData2(table, Studio) {
//     const url = `https://app.snookerplus.in/apis/data/topup/${encodeURIComponent(Studio)}`;
//     console.log('Fetching data from:', url);

//     try {
//         const response = await fetch(url);

//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log('Fetched topup data:', data);

//         return data[0];
//     } catch (error) {
//         console.error('Error fetching topup data:', error);
//         return [];
//     }
// }

function updateSelectedDateBox(groupedData, topupGroupedData, selectedDate) {
  const selectedDateBox = document.getElementById("selectedDateBox");
  if (!selectedDateBox) {
    console.error('Element with ID "selectedDateBox" not found.');
    return;
  }

  const dateString = new Date(selectedDate).toISOString().split("T")[0];
  const data = groupedData[dateString];
  const topupData = topupGroupedData[dateString];

  if (data) {
    selectedDateBox.innerHTML = `
            <h2>Details for ${dateString} (${data.dayOfWeek})</h2>
            <p>Total Duration: ${data.duration.toFixed(2)} minutes</p>
            <p>Total Money: ₹${data.totalMoney.toFixed(2)}</p>
        `;
  } else {
    selectedDateBox.innerHTML = `<p>No data available for ${dateString}</p>`;
  }

  // if (topupData) {
  //   updateTotalReceivedBox(topupData.cash, topupData.online);
  // } else {
  //   updateTotalReceivedBox(0, 0);
  // }
}

function convertToIST(date) {
  if (!date) return null; // Return null if date is undefined or invalid
  // console.log('date', date);
  const utcDate = new Date(date);
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
  const istDate = new Date(utcDate.getTime() + istOffset);

  return istDate;
}

function getDayOfWeek(date) {
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return daysOfWeek[date.getDay()];
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
  let monthSelect = document.getElementById("mainMonth");
  let opt = document.createElement("option");
  opt.className="monthName";
  opt.value = i;
  opt.innerText = month;
  monthSelect.appendChild(opt);
}

function groupDataByDate(frames, month, year) {
  // console.log('month func', typeof(month));
  
  const groupedData = {};
  let totalTableMoney = 0;

  frames.forEach((frame) => {
    forWeek = convertToIST(frame.StartTime);
    const date = new Date(frame.StartTime).toISOString().split("T")[0];

    if (!date || isNaN(new Date(frame.StartTime).getTime())) {
      // Handle invalid dates
      console.error("Invalid date:", frame.StartTime);
      return;
    }

    const duration = parseInt(frame.Duration, 10) || 0; // Assuming duration is already in minutes
    const totalMoney = parseFloat(frame.TotalMoney) || 0;

    const frameMonth = parseInt(date.split("-")[1]) - 1; //0-11
    const frameYear = parseInt(date.split("-")[0]);

    // Filter only the frames in the current month and year
    if (frameMonth === month && frameYear === year) {

      // console.log('frameMonthSelected', frameMonth)
      const day = date.split("-")[2];       // Get day of the month
      const monthString = date.split("-")[1].padStart(2, '0'); // Month is 0-indexed
      const yearString = date.split("-")[0];
      
      const dateString = `${yearString}-${monthString}-${day.toString().padStart(2, '0')}`; // Get the date in YYYY-MM-DD format
      // console.log('dateString :', dateString ,"\n  frameMonth :",frameMonth ,"\n date :",date);
      const dayOfWeek = getDayOfWeek(forWeek);

      if (!groupedData[dateString]) {
        groupedData[dateString] = { duration: 0, totalMoney: 0, dayOfWeek };
      }

      groupedData[dateString].duration += duration; // Sum the duration for each date
      groupedData[dateString].totalMoney += totalMoney; // Sum the total money for each date
      totalTableMoney += totalMoney; // Add to total table money
    }
  });
  // console.log('groupedData', groupedData)
  return { groupedData, totalTableMoney };
}

function groupTopupDataByDate(topupData, month, year) {
  const groupedData = {};

  topupData.forEach((topup) => {
    if (!topup.RecordDate) {
      console.error("RecordDate is undefined:", "hello");
      return; // Skip entries with undefined RecordDate
    }

    const date = new Date(topup.RecordDate);
    if (isNaN(date.getTime())) {
      console.error("Invalid date:", topup.RecordDate);
      return; // Skip invalid dates
    }

    const topupMonth = date.getMonth();
    const topupYear = date.getFullYear();

    // Filter for the selected month and year
    if (topupMonth === month && topupYear === year) {
      const dateString = date.toISOString().split("T")[0]; // Convert to YYYY-MM-DD format
      const amount = parseFloat(topup.Amount) || 0;

      if (!groupedData[dateString]) {
        groupedData[dateString] = { cash: 0, online: 0 };
      }

      if (topup.Mode === "cash") {
        groupedData[dateString].cash += amount;
      } else if (topup.Mode === "online") {
        groupedData[dateString].online += amount;
      }
    }
  });

  return groupedData;
}

function updateSelectedDateBox(groupedData, topupGroupedData, selectedDate) {
  const selectedDateBox = document.getElementById("selectedDateBox");
  if (!selectedDateBox) {
    console.error('Element with ID "selectedDateBox" not found.');
    return;
  }

  console.log("selectedDate", selectedDate);
  const dateString = new Date(selectedDate).toISOString().split("T")[0];
  const data = groupedData[dateString];
  const topupData = topupGroupedData[dateString];

  if (data) {
    selectedDateBox.innerHTML = `
            <h2>Details for ${dateString} (${data.dayOfWeek})</h2>
            <p>Total Duration: ${data.duration.toFixed(2)} minutes</p>
            <p>Total Money: ₹${data.totalMoney.toFixed(2)}</p>
        `;
  } else {
    selectedDateBox.innerHTML = `<p>No data available for ${dateString}</p>`;
  }

  // if (topupData) {
  //   updateTotalReceivedBox(topupData.cash, topupData.online);
  // } else {
  //   updateTotalReceivedBox(0, 0);
  // }
}

let analyticsChart = null; // Initialize as null

function updateChart(groupedData) {
  const ctx = document.getElementById("analyticsChart").getContext("2d");

  const labels = Object.keys(groupedData);
  const durations = labels.map((date) => groupedData[date].duration);
  const totalMoney = labels.map((date) => groupedData[date].totalMoney);

  // Colors for each bar: normal color or different for Sundays
  const backgroundColors = labels.map((date) => {
    const dayOfWeek = new Date(date).getDay(); // Get the day of the week (0 for Sunday)
    return dayOfWeek === 0
      ? "rgba(255, 99, 132, 0.2)"
      : "rgba(75, 192, 192, 0.2)"; // Red for Sundays
  });

  const borderColors = labels.map((date) => {
    const dayOfWeek = new Date(date).getDay();
    return dayOfWeek === 0 ? "rgba(255, 99, 132, 1)" : "rgba(75, 192, 192, 1)"; // Red for Sundays
  });

  if (analyticsChart) {
    analyticsChart.destroy(); // Destroy existing chart instance if it exists
  }

  analyticsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Total Duration (minutes)",
          data: durations,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
        },
        {
          label: "Total Money",
          data: totalMoney,
          backgroundColor: "rgba(153, 102, 255, 0.2)",
          borderColor: "rgba(153, 102, 255, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Values",
          },
        },
      },
      plugins: {
        legend: {
          display: true,
        },
      },
    },
  });
}

function updateTotalMoneyBox(totalTableMoney) {
  const totalMoneyBox = document.getElementById("totalMoneyBox");
  if (!totalMoneyBox) {
    console.error('Element with ID "totalMoneyBox" not found.');
    return;
  }

  totalMoneyBox.innerHTML = `<p>Total Table Money: ₹${totalTableMoney.toFixed(
    2
  )}</p>`;
}

async function init1(framesData, topupData) {
  const table = "frames";

  // Get the Studio parameter from the URL
  const Studio = getParameterByName("Studio") || "Default Studio";
  console.log("Studio:", Studio);

  const currentDate = new Date();
  // console.log('currentDate', currentDate)
  const currentMonth = currentDate.getMonth(); // 0-11 (0 for January, 11 for December)
  const currentYear = currentDate.getFullYear();

  const selectedMonth = document.getElementById("mainMonth");
  selectedMonth.value= currentMonth+1;


  try {
    if (framesData.length === 0 || topupData.length === 0) {
      console.error("No data available.");
      return;
    }

    // Filter frames and topup data by the current month and year
    let { groupedData, totalTableMoney } = groupDataByDate(
      framesData,
      currentMonth,
      currentYear
    );
    let topupGroupedData = groupTopupDataByDate(
      topupData,
      currentMonth,
      currentYear
    );

    // Display the chart for the selected month
    updateChart(groupedData);
    updateTotalMoneyBox(totalTableMoney);

    
    
    selectedMonth.addEventListener("change",(event )=>{
      const month = parseInt(event.target.value)-1;
      
      let { groupedData, totalTableMoney } = groupDataByDate(
        framesData,
        month,
        currentYear
      );
      topupGroupedData = groupTopupDataByDate(
        topupData,
        month,
        currentYear
      );
  
      // Display the chart for the selected month
      updateChart(groupedData);
      updateTotalMoneyBox(totalTableMoney);
    })

    const datePicker = document.getElementById("datePicker");
    datePicker.addEventListener("change", () => {
      const selectedDate = datePicker.value;
      console.log('selectedDate', selectedDate)
      let month =parseInt( selectedDate.split("-")[1]) - 1;
      let { groupedData, totalTableMoney } = groupDataByDate(
        framesData,
        month,
        currentYear
      );
      topupGroupedData = groupTopupDataByDate(
        topupData,
        month,
        currentYear
      );
      updateSelectedDateBox(groupedData, topupGroupedData, selectedDate);
      console.log('groupedData', groupedData)
    });
    

    // Set up date click event listeners
    const analyticsChartCanvas = document.getElementById("analyticsChart");
    if (analyticsChartCanvas) {
      analyticsChartCanvas.onclick = function (evt) {
        const points = analyticsChart.getElementsAtEventForMode(
          evt,
          "nearest",
          { intersect: true },
          false
        );
        if (points.length > 0) {
          const firstPoint = points[0];
          const label = analyticsChart.data.labels[firstPoint.index];
          console.log("label is ", label);
          updateSelectedDateBox(groupedData, topupGroupedData, label);
        }
      };
    }

    // Initialize total received box with 0 cash and online values
    // updateTotalReceivedBox(0, 0);
  } catch (error) {
    console.error("Error initializing app:", error);
  }
}

// window.onload = init1;
