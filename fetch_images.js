const https = require('https');

https.get('https://m1g.org.tr/', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
        let match;
        const images = new Set();
        while ((match = regex.exec(data)) !== null) {
            images.add(match[1]);
        }
        console.log(Array.from(images).join('\n'));
    });
}).on('error', (e) => {
    console.error(e);
});
