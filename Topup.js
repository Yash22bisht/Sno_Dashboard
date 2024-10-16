// Function to get 'studio' from the URL query parameter
function getStudioFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('studio') || 'defaultStudio'; // Fallback to 'defaultStudio' if not provided
}

async function fetchTopupData(studio) {
    const url = `https://app.snookerplus.in/apis/data/topup/${encodeURIComponent(studio)}`;
    console.log('Fetching data from:', url);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched topup data:', data);

        return data[0];
    } catch (error) {
        console.error('Error fetching topup data:', error);
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

    return ISTDate.toISOString().split('T')[0];
}

function groupTopupDataByDate(topupData) {
    const groupedData = {};

    topupData.forEach(topup => {
        if (!topup.RecordDate) {
            console.error('RecordDate is undefined:', topup);
            return;
        }

        const date = new Date(topup.RecordDate);
        if (isNaN(date.getTime())) {
            console.error('Invalid date:', topup.RecordDate, 'Date:', date);
            return;
        }

        const businessDay = getBusinessDay(date);
        const amount = parseFloat(topup.Amount) || 0;

        if (!groupedData[businessDay]) {
            groupedData[businessDay] = { cash: 0, online: 0 };
        }

        const mode = topup.Mode.trim().toLowerCase();
        if (mode === 'cash') {
            groupedData[businessDay].cash += amount;
        } else if (mode === 'online') {
            groupedData[businessDay].online += amount;
        } else {
            console.error('Unknown mode:', topup.Mode);
        }
    });

    return groupedData;
}

function populateTopupTable(groupedData) {
    const topupTableBody = document.querySelector('#topupTable tbody');
    const totalTopupElem = document.querySelector('#totalTopup');
    const onlineTotalElem = document.querySelector('#onlineTotal');
    const cashTotalElem = document.querySelector('#cashTotal');

    if (!topupTableBody) {
        console.error('Element with ID "topupTable" not found.');
        return;
    }

    topupTableBody.innerHTML = '';  // Clear any existing rows

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
    const dateSelector = document.querySelector('#dateSelector');
    const today = new Date().toISOString().split('T')[0];
    dateSelector.value = today;
}

async function init() {
    // Get studio name from the URL
    const studio = getStudioFromUrl();
    console.log('Studio:', studio);
    
    const topupData = await fetchTopupData(studio);
    console.log('Data received for processing:', topupData);

    if (!topupData.length) {
        console.error('No data available for processing.');
        return;
    }

    const groupedData = groupTopupDataByDate(topupData);
    populateTopupTable(groupedData);

    setDefaultDate();

    document.querySelector('#dateSelector').addEventListener('change', (event) => {
        const selectedDate = event.target.value;
        if (selectedDate) {
            const filteredData = filterByDate(groupedData, selectedDate);
            populateTopupTable(filteredData);
        } else {
            populateTopupTable(groupedData);
        }
    });
}

window.addEventListener('load', init);
