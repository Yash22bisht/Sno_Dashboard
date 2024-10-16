// Convert the current UTC time to IST (Indian Standard Time)
function getCurrentDateInIST() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000; // Get the timezone offset in milliseconds
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istTime = new Date(now.getTime() + offset + istOffset);
    
    return istTime.toISOString().split('T')[0];  // Return the date in YYYY-MM-DD format
}

// Convert UTC time to IST (Indian Standard Time)
function toIST(date) {
    const offset = date.getTimezoneOffset() * 60000; // Get the timezone offset in milliseconds
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    return new Date(date.getTime() + offset + istOffset);
}

// Function to extract studio name from the URL query string
function getStudioFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('studio') || 'Studio 111'; // Default to 'Studio 111' if no studio is specified in the URL
}

async function fetchTableData(studio) {
    const url = `https://app.snookerplus.in/apis/data/frames/${encodeURIComponent(studio)}`;
    console.log('Fetching data from:', url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Full API response:', data);

        if (!data || data.length === 0) {
            console.warn('API returned empty data or invalid structure:', data);
            return [];
        }

        return data[0]; // Returning the first element, assuming the data structure is an array
    } catch (error) {
        console.error('Error fetching table data:', error);
        return [];
    }
}

function filterDataByDate(tableData, targetDate) {
    console.log('Filtering data for target date:', targetDate);

    return tableData.filter(entry => {
        const startDate = toIST(new Date(entry.StartTime));
        const offDate = toIST(new Date(entry.OffTime));

        console.log(`Entry Start: ${startDate}, Entry End: ${offDate}`);

        const targetDateObj = new Date(targetDate);
        
        const isValid = (
            startDate.toDateString() === targetDateObj.toDateString() ||
            offDate.toDateString() === targetDateObj.toDateString() ||
            (startDate < targetDateObj && offDate > targetDateObj)
        );

        console.log(`Is valid for target date (${targetDate})?`, isValid);
        return isValid;
    });
}

function getTableOccupancy(filteredData, targetDate) {
    const occupancyData = {};

    const targetDateStart = new Date(`${targetDate}T00:00:00`);
    const targetDateEnd = new Date(`${targetDate}T23:59:59`);
    const currentTime = new Date(); // Current time for ongoing frames

    filteredData.forEach(entry => {
        const tableId = entry.TableId;
        let startTime = toIST(new Date(entry.StartTime));
        let offTime = entry.OffTime ? toIST(new Date(entry.OffTime)) : currentTime; // If OffTime is missing, use the current time

        if (startTime < targetDateStart) startTime = targetDateStart;
        if (offTime > targetDateEnd) offTime = targetDateEnd;

        if (offTime <= startTime) return;

        if (!occupancyData[tableId]) {
            occupancyData[tableId] = [];
        }

        occupancyData[tableId].push({
            date: targetDate,
            startTime: startTime.getHours() + startTime.getMinutes() / 60,
            offTime: offTime.getHours() + offTime.getMinutes() / 60,
        });
    });

    Object.keys(occupancyData).forEach(tableId => {
        occupancyData[tableId].sort((a, b) => a.startTime - b.startTime);
    });

    return occupancyData;
}

function displayTableOccupancyChart(occupancyData) {
    const chartContainer = document.getElementById('tableOccupancyChart');
    chartContainer.innerHTML = '';

    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);

    const datasets = [];
    const uniqueDates = [];

    Object.keys(occupancyData).forEach(tableId => {
        const dataPoints = occupancyData[tableId].map(entry => {
            if (!uniqueDates.includes(entry.date)) uniqueDates.push(entry.date);

            return {
                x: entry.date,
                y: [entry.startTime, entry.offTime]  // Start and end times as y values
            };
        });

        const randomColor = `rgba(${Math.floor(Math.random() * 255)}, 99, 132, 0.5)`;

        datasets.push({
            label: `Table ${tableId}`,
            data: dataPoints,
            backgroundColor: randomColor,
            borderColor: randomColor.replace('0.5', '1'),
            borderWidth: 1
        });
    });

    // Get the current time in hours (24-hour format)
    const now = toIST(new Date());
    const currentTime = now.getHours() + now.getMinutes() / 60;

    // Plugin to draw the horizontal line for the current time
    const currentTimePlugin = {
        id: 'currentTimeLine',
        beforeDraw: (chart) => {
            const ctx = chart.ctx;
            const yScale = chart.scales.y;

            // Find the pixel position for the current time
            const yPosition = yScale.getPixelForValue(currentTime);

            // Draw the line
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(chart.chartArea.left, yPosition);
            ctx.lineTo(chart.chartArea.right, yPosition);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
    };

    // Create the chart with the plugin for the horizontal line
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: uniqueDates,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 24,
                    ticks: {
                        stepSize: 0.25,  // 15-minute intervals
                        callback: function (value) {
                            const hours = Math.floor(value);
                            const minutes = Math.floor((value - hours) * 60);
                            return `${hours}:${minutes < 10 ? '0' + minutes : minutes}`; 
                        }
                    },
                    title: {
                        display: true,
                        text: 'Time (24-hour scale)',
                        font: { size: window.innerWidth < 768 ? 10 : 14 }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date',
                        font: { size: window.innerWidth < 768 ? 10 : 14 }
                    },
                    ticks: {
                        autoSkip: false,
                        font: { size: window.innerWidth < 768 ? 10 : 12 }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        font: { size: window.innerWidth < 768 ? 10 : 14 }
                    }
                }
            }
        },
        plugins: [currentTimePlugin]
    });
}

// Initialize the script with the correct date
async function init() {
    const studio = getStudioFromUrl();  // Get studio from URL
    const dateInput = document.getElementById('dateSelector');

    const today = getCurrentDateInIST();  // Get the current date in IST
    dateInput.value = today;

    await loadDataForDate(studio, today);

    dateInput.addEventListener('change', async (event) => {
        const selectedDate = event.target.value;
        console.log('Date selected:', selectedDate);
        await loadDataForDate(studio, selectedDate);
    });
}

async function loadDataForDate(studio, targetDate) {
    const tableData = await fetchTableData(studio);
    const filteredData = filterDataByDate(tableData, targetDate);
    const occupancyData = getTableOccupancy(filteredData, targetDate);

    displayTableOccupancyChart(occupancyData);
}

// Initialize the script
init();
