let allEnergyData = [];

const files = [
  "energy_data_2026-07-30.js",
  "energy_data_2026-07-31.js",
  "energy_data_2026-08-01.js",
  "energy_data_2026-08-02.js",
  "energy_data_2026-08-03.js",
  "energy_data_2026-08-04.js",
  "energy_data_2026-08-05.js",
  "energy_data_2026-08-06.js",
  "energy_data_2026-08-07.js",
  "energy_data_2026-08-08.js",
];


function loadScript(src) {
    return new Promise((resolve, reject) => {

        let script = document.createElement("script");

        script.src = src;

        script.onload = () => {
            allEnergyData.push(...window.currentEnergyData);
            delete window.currentEnergyData;
            resolve();
        };

        script.onerror = reject;

        document.head.appendChild(script);
    });
}


async function loadAll() {

    for (const file of files) {
        await loadScript(file);
    }

    createTable();
}


function createTable() {

    let table = document.getElementById("table");

    let sumYellow = 0;
    let sumBlue = 0;

    let rows = allEnergyData.map(row => {

        let col5 = row.price_eur_per_mwh * row.solar_capacity_factor_percent;
        let col6 = row.price_eur_per_mwh * row.wind_capacity_factor_percent;

        sumYellow += col5;
        sumBlue += col6;

        return `
            <tr>
                <td>${row.datetime_budapest}</td>
                <td>${row.price_eur_per_mwh.toFixed(1)}</td>
                <td>${row.solar_capacity_factor_percent.toFixed(1)}%</td>
                <td>${row.wind_capacity_factor_percent.toFixed(1)}%</td>
                <td style="background-color: yellow;">
                    ${col5.toFixed(1)}
                </td>
                <td style="background-color: lightblue;">
                    ${col6.toFixed(1)}
                </td>
            </tr>
        `;
    }).join("");

    table.innerHTML = `
        ${rows}
    `;
	
	let div = document.getElementById("div");
	div.innerHTML = `
		<span style="background-color:yellow">nap = ${sumYellow.toFixed(1)}</span>
		<span style="background-color:aqua">szél = ${sumBlue.toFixed(1)}</span>
	`
}


loadAll();