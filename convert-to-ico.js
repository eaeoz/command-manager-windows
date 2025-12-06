const toIco = require('to-ico');
const fs = require('fs');

async function convertToIco() {
    try {
        console.log('Converting PNG to ICO...');
        
        // Read the 256x256 PNG file
        const pngBuffer = fs.readFileSync('app-icon-256.png');
        
        // Convert the PNG to ICO
        const icoBuffer = await toIco([pngBuffer]);
        
        // Save as favicon.ico
        fs.writeFileSync('favicon.ico', icoBuffer);
        
        console.log('✅ Success! Created favicon.ico (256x256)');
        console.log('📁 Location: ' + __dirname + '\\favicon.ico');
        console.log('');
        console.log('You can now build your app with:');
        console.log('  npm run build-win');
        
    } catch (error) {
        console.error('❌ Error converting to ICO:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

convertToIco();
