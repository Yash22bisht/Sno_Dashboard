// Function to get 'studio' from the URL query parameter
function getStudioFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('studio') || 'Studio 111'; // Fallback to 'defaultStudio' if not provided
}

// Helper function to get other URL parameters
function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`, 'i');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Fetch data function for both general data and topup data
async function fetchData(table, studio, isTopup = false) {
    const baseUrl = 'https://app.snookerplus.in/apis/data/';
    const endpoint = isTopup ? `topup/${encodeURIComponent(studio)}` : `${table}/${encodeURIComponent(studio)}`;
    const url = `${baseUrl}${endpoint}`;
    console.log('Fetching data from:', url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Fetched ${isTopup ? 'topup' : 'data'}:`, data);
        return data[0];
    } catch (error) {
        console.error(`Error fetching ${isTopup ? 'topup' : 'data'}:`, error);
        return [];
    }
}

// Convert UTC date to IST
function convertToIST(date) {
    if (!date) return null;  // Return null if date is undefined or invalid
    const utcDate = new Date(date);
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
    return new Date(utcDate.getTime() + istOffset);
}

// Get day of the week
function getDayOfWeek(date) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return daysOfWeek[date.getDay()];
}

// Group frames data by date, filtering by month and year
function groupDataByDate(frames, month, year) {
    const groupedData = {};
    let totalTableMoney = 0;

    frames.forEach(frame => {
        const date = convertToIST(frame.StartTime);
        if (!date || isNaN(date.getTime())) {
            console.error('Invalid date:', frame.StartTime);
            return;
        }

        const duration = parseInt(frame.Duration, 10) || 0;
        const totalMoney = parseFloat(frame.TotalMoney) || 0;

        const frameMonth = date.getMonth();  // 0-11 for Jan-Dec
        const frameYear = date.getFullYear();

        if (frameMonth === month && frameYear === year) {
            const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
            const dayOfWeek = getDayOfWeek(date);

            if (!groupedData[dateString]) {
                groupedData[dateString] = { duration: 0, totalMoney: 0, dayOfWeek };
            }

            groupedData[dateString].duration += duration;
            groupedData[dateString].totalMoney += totalMoney;
            totalTableMoney += totalMoney;
        }
    });

    return { groupedData, totalTableMoney };
}

// Group topup data by date, filtering by month and year
function groupTopupDataByDate(topupData, month, year) {
    const groupedData = {};

    topupData.forEach(topup => {
        if (!topup.RecordDate) {
            console.error('RecordDate is undefined:', topup);
            return;
        }

        const date = new Date(topup.RecordDate);
        if (isNaN(date.getTime())) {
            console.error('Invalid date:', topup.RecordDate);
            return;
        }

        const topupMonth = date.getMonth();
        const topupYear = date.getFullYear();

        if (topupMonth === month && topupYear === year) {
            const dateString = date.toISOString().split('T')[0];
            const amount = parseFloat(topup.Amount) || 0;

            if (!groupedData[dateString]) {
                groupedData[dateString] = { cash: 0, online: 0 };
            }

            if (topup.Mode === 'cash') {
                groupedData[dateString].cash += amount;
            } else if (topup.Mode === 'online') {
                groupedData[dateString].online += amount;
            }
        }
    });

    return groupedData;
}

// Populate table with grouped data
function populateTopupTable(groupedData) {
    const topupTableBody = document.querySelector('#topupTable tbody');
    const totalTopupElem = document.querySelector('#totalTopup');
    const onlineTotalElem = document.querySelector('#onlineTotal');
    const cashTotalElem = document.querySelector('#cashTotal');

    if (!topupTableBody) {
        console.error('Element with ID "topupTable" not found.');
        return;
    }

    topupTableBody.innerHTML = '';  // Clear existing rows

    let totalTopup = 0;
    let onlineTotal = 0;
    let cashTotal = 0;

    Object.keys(groupedData).forEach(date => {
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

// Set default date
function setDefaultDate() {
    const dateSelector = document.querySelector('#dateSelector');
    const today = new Date().toISOString().split('T')[0];
    dateSelector.value = today;
}

// Initialize the app and fetch data
async function init() {
    const studio = getStudioFromUrl();
    console.log('Studio:', studio);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-11 (0 for January)
    const currentYear = currentDate.getFullYear();

    try {
        const framesData = await fetchData('frames', studio);
        const topupData = await fetchData('topup', studio, true);

        if (framesData.length === 0 || topupData.length === 0) {
            console.error('No data available.');
            return;
        }

        const { groupedData, totalTableMoney } = groupDataByDate(framesData, currentMonth, currentYear);
        const topupGroupedData = groupTopupDataByDate(topupData, currentMonth, currentYear);

        // Populate table with grouped data
        populateTopupTable(topupGroupedData);
        setDefaultDate();

        document.querySelector('#dateSelector').addEventListener('change', (event) => {
            const selectedDate = event.target.value;
            if (selectedDate) {
                const filteredData = filterByDate(topupGroupedData, selectedDate);
                populateTopupTable(filteredData);
            } else {
                populateTopupTable(topupGroupedData);
            }
        });
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Function to filter data by a selected date
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

// Utility function to get the business day considering IST timezone
function getBusinessDay(date) {
    const ISTOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const ISTDate = new Date(date.getTime() + ISTOffset);
    const hours = ISTDate.getUTCHours();

    if (hours < 6) {
        ISTDate.setUTCDate(ISTDate.getUTCDate() - 1);
    }

    return ISTDate.toISOString().split('T')[0];
}

window.addEventListener('load', init);
