const fs = require('fs')
const path = require('path')

function checkDir(dir) {
  fs.readdir(dir, (err, files) => {
    if (err) throw err

    files.forEach(file => {
      const pathtofile = path.resolve(dir, file)

      fs.stat(pathtofile, (err, stats) => {
        if (err) throw err

        if (stats.isFile()) {
          if (file.startsWith('test-')) {
            fs.readFile(pathtofile, 'utf8', (err, data) => {
              if (err) throw err

              const match = data.match(/@supported: >= ([0-9]+)/)

              if (!match) {
                console.log(pathtofile)
                return
              } else if (+process.version[1] >= +match[1]) {
                console.log(pathtofile)
              }
            })
          }
        } else {
          checkDir(pathtofile)
        }
      })
    })
  })
}

checkDir(path.resolve(__dirname, '..', 'tests'))
