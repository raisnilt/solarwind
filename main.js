let allEnergyData = [];

const files = [
  "energy_data_2026-08-21.js",
  "energy_data_2026-08-20.js",
  "energy_data_2026-08-19.js",
  "energy_data_2026-08-18.js",
  "energy_data_2026-08-17.js",
  "energy_data_2026-08-16.js",
  "energy_data_2026-08-15.js",
  "energy_data_2026-08-14.js",
  "energy_data_2026-08-13.js",
  "energy_data_2026-08-12.js",
  "energy_data_2026-08-11.js",
  "energy_data_2026-08-10.js",
  "energy_data_2026-08-09.js",
  "energy_data_2026-08-08.js",
  "energy_data_2026-08-07.js",
  "energy_data_2026-08-06.js",
  "energy_data_2026-08-05.js",
  "energy_data_2026-08-04.js",
  "energy_data_2026-08-03.js",
  "energy_data_2026-08-02.js",
  "energy_data_2026-08-01.js",
  "energy_data_2026-07-31.js",
  "energy_data_2026-07-30.js",
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

	let rows = [];

	for (let i = 0; i < allEnergyData.length; i += 24) {

		 let dayData = allEnergyData.slice(i, i + 24).reverse();

		 for (const row of dayData) {

			  let col5 = row.price_eur_per_mwh * row.solar_capacity_factor_percent;
			  let col6 = row.price_eur_per_mwh * row.wind_capacity_factor_percent;

			  sumYellow += col5;
			  sumBlue += col6;

			  rows.push(`
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
			  `);
		 }
	}

	rows = rows.join("");

    table.innerHTML = `
			<tr>
				 <th><a href="https://app.electricitymaps.com/map/zone/HU/live/hourly?signal=renewable-energy">source</a></th>
				 <th>áram ára (eur/MWh)</th>
				 <th>nap kapacitás</th>
				 <th>szél kapacitás</th>
				 <th>nap <abbr title="kapacitás * ára">'értéke'</abbr></th>
				 <th>szél <abbr title="kapacitás * ára">'értéke'</abbr></th>
			</tr>
        ${rows}
    `;
	
	let div = document.getElementById("div");
	div.innerHTML = `
		<span style="background-color:yellow">nap = ${sumYellow.toFixed(1)}</span>
		<span style="background-color:aqua">szél = ${sumBlue.toFixed(1)}</span>
	`
}


loadAll();