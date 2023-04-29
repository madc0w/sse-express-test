const express = require('express');
const server = express();
const port = process.env.PORT || 3000;

server.listen(port, () => {
	console.log(`listening on port ${port}`);
});

server.get('/', (req, res) => {
	let html = '';
	html += '<html>';
	html += '<head>';
	html += '<script>\n';
	html += 'function load() {\n';
	html += 'const outputDiv = document.getElementById("output");\n';

	html += 'const evtSource = new EventSource("/sse");\n';
	html += 'evtSource.onerror = (err) => {\n';
	html += '	console.error("EventSource error", err);\n';
	html += '};\n';

	html += 'evtSource.onmessage = (e) => {\n';
	html += 'if (e.data === "[DONE]") {\n';
	html += '	console.log("[DONE]", e);\n';
	html += '	evtSource.close();\n';
	html += '} else {\n';
	html += '	console.log("message", e);\n';
	html += '	outputDiv.innerHTML = e.data;\n';
	html += '}\n';
	html += '};\n';

	html += '}\n';
	html += '</script>';
	html += '</head>';
	html += '<body onload="load()">';
	html += 'output:';
	html += '<div id="output"></div>';
	html += '</body>';
	html += '</html>';
	res.send(html);
});

server.get('/sse', (req, res) => {
	console.log('enter sse');
	console.log('res', res);

	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Connection', 'keep-alive');
	res.flushHeaders(); // flush the headers to establish SSE with client

	let counter = 0;
	const intervalId = setInterval(() => {
		counter++;
		console.log('will res.write. counter', counter);
		res.write(
			`data: ${JSON.stringify({ text: 'hi there', num: counter })}\n\n`
		);
		if (counter >= 10) {
			// this is also what OpenAI uses to signal end of stream https://platform.openai.com/docs/api-reference/completions/create#completions/create-stream
			res.write('data: [DONE]\n\n');
			clearInterval(intervalId);
			// res.end(); // terminates SSE session
			return;
		}
	}, 800);

	// If client closes connection, stop sending events
	res.on('close', () => {
		console.log('client dropped me');
		clearInterval(intervalId);
		res.end();
	});
});
