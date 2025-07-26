const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
app.use(express.json({ limit: '2mb' }));

app.post('/chart', async (req, res) => {
  const chartData = req.body;

  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
      <style>
        body { margin: 0; }
        #piechart_3d { width: 800px; height: 600px; }
      </style>
    </head>
    <body>
      <div id="piechart_3d"></div>
      <script type="text/javascript">
        google.charts.load("current", {packages:["corechart"]});
        google.charts.setOnLoadCallback(drawChart);
        function drawChart() {
          var data = google.visualization.arrayToDataTable(${JSON.stringify(chartData.data)});
          var options = ${JSON.stringify(chartData.options)};
          var chart = new google.visualization.PieChart(document.getElementById('piechart_3d'));
          chart.draw(data, options);
          setTimeout(() => window.done = true, 1000); // Signal ready
        }
      </script>
    </body>
  </html>
  `;

  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 600 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForFunction(() => window.done === true);
  const chartElement = await page.$('#piechart_3d');
  const screenshot = await chartElement.screenshot({ encoding: 'base64' });
  await browser.close();

  res.set('Content-Type', 'image/png');
  res.send(Buffer.from(screenshot, 'base64'));
});

app.listen(3001, () => console.log('📊 Google Chart API running at http://localhost:3001/chart'));
