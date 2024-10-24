async function fetchData(table, Studio) {
    const url = ` https://app.snookerplus.in/apis/data/${table}/${Studio}`;
    console.log('Fetching data from:', url);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched data:', data);

        return data[0];  // Flatten the nested arrays into a single array
    } catch (error) {
        console.error('Error fetching data:', error);
        return []; // Return an empty array or handle the error as needed
    }
}

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&'); // Escape brackets
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`, 'i'); // Case-insensitive matching
    const results = regex.exec(url);
    if (!results) return null; // If no result is found
    if (!results[2]) return ''; // If no value is found
    return decodeURIComponent(results[2].replace(/\+/g, ' ')); // Decode and replace "+" with space
}

const Studio = getParameterByName('Studio')
var data;

async function init() {
    try {
        // Fetch data from the API
        data = {
            framesData: await fetchData("frames", Studio),  // Fetch frames data
            topupData: await fetchData("topup", Studio)     // Fetch topup data (changed from 'frames' to 'topup')
        };

        // Call subsequent initialization functions with the fetched data
        init1(data.framesData, data.topupData);
        init2(data.topupData);
        init3(data.framesData);

    } catch (error) {
        console.error('Error fetching data:', error);  // Error handling for failed fetches
    }
}

window.onload = init;
// console.log('data', data)