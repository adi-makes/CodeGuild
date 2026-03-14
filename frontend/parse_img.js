const fs = require('fs');
const PNG = require('pngjs').PNG;

fs.createReadStream('./public/guild-hall.png')
  .pipe(new PNG({ filterType: 4 }))
  .on('parsed', function() {
    console.log("Image size:", this.width, "x", this.height);
    let minX = this.width, minY = this.height, maxX = 0, maxY = 0;
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let idx = (this.width * y + x) << 2;
        // Check if pixel is not black. Assuming black is R=0,G=0,B=0 or close to it
        if (this.data[idx] > 5 || this.data[idx+1] > 5 || this.data[idx+2] > 5) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    console.log(`Bounding box: x: ${minX}-${maxX}, y: ${minY}-${maxY}`);
    console.log(`Building width: ${maxX - minX}, height: ${maxY - minY}`);
  });
