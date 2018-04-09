const path = require('path')
const fs = require('fs-extra')

const ProductionLine = require('productionline-web')
const TaskRunner = require('shortbus')

const Postcss = require('postcss')
const Chassis = require('@chassis/core')
const CleanCss = require('clean-css')

class Builder extends ProductionLine {
  constructor (cfg) {
    super(cfg)

    this.chassis = Postcss([
      Chassis({
        importBasePath: path.resolve(`${this.SOURCE}/css`),
        theme: path.resolve(`${this.SOURCE}/main.theme`),
        layout: {
          minWidth: 320,
          maxWidth: 1200
        }
      })
    ])
  }

  buildCSS (minify = true) {
    this.addTask('Build CSS', next => {
      let tasks = new TaskRunner()

      this.walk(path.join(this.SOURCE, '/**/*.css')).forEach(filepath => {
        let filename = /[^/]*$/.exec(filepath)[0]

        if (filename.startsWith('_')) {
          return
        }

        tasks.add(`Process ${this.localDirectory(filepath)}`, cont => {
          let css = this.readFileSync(filepath)

          this.chassis.process(css, {from: void 0}).then(res => {
            let outputPath = this.outputDirectory(filepath)

            if (!minify) {
              this.writeFile(outputPath, res.css, cont)
              return
            }

            let minified = new CleanCss({
              sourceMap: true
            }).minify(res.css)

            if (minified.sourceMap) {
              this.writeFileSync(`${outputPath}.map`, minified.sourceMap)
            }

            // this.writeFile(outputPath, this.applyHeader(minified.styles, 'css'), cont)
            // TODO: Check this.applyHeader (its returning undefined)
            this.writeFile(outputPath, minified.styles, cont)
          }).catch(err => this.failure(err))
        })
      })

      tasks.on('complete', next)
      tasks.run()
    })
  }

  make () {
    this.clean()
    this.copyAssets()
    this.buildHTML()
    this.buildJavaScript()
    this.buildCSS()
  }
}

const builder = new Builder({
  commands: {
    '--build' (cmd) {
      this.make()
    }
  }
})

builder.run()
