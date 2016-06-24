'use strict'

var test = require('tape')

test('NGN.BUS', function (t) {
  NGN.BUS.on('test', function (data) {
    t.pass('NGN.BUS subscribed to basic event.')
    t.ok(data.payload === 1, 'NGN.BUS received event with data payload.')

    var heard = 0
    var total = 0
    NGN.BUS.once('testonce', function () {
      heard++
    })

    NGN.BUS.on('testonce', function () {
      total++

      if (total > 1) {
        t.ok(heard === 1, 'NGN.BUS one-time event handler works.')

        NGN.BUS.once('testagain', function () {
          t.pass('NGN.BUS.once() works.')

          NGN.BUS.on('testagain', function () {
            t.pass('NGN.BUS.on() works.')

            NGN.BUS.once('bind.test.complete', function () {
              t.pass('NGN.BUS bind target 3 heard.')

              setTimeout(function () {
                NGN.BUS.once('notcalled', function () {})

                NGN.BUS.off('testagain')

                // t.ok(Object.keys(NGN.BUS.subscribers).length === 5, 'NGN.BUS.subscribers returns proper subscribers.')
                // t.ok(NGN.BUS.adhocSubscribers.length === 1, 'NGN.BUS.adhocSubscribers returns proper number of adhoc subscribers.')
                // t.ok(NGN.BUS.autoSubscribers.length === 1, 'NGN.BUS.autoSubscribers returns proper number of bound subscribers.')
                // t.ok(Object.keys(NGN.BUS.onrs).length === 4, 'NGN.BUS.onrs returns correct number of total subscribers.')

                NGN.BUS.pool('pool.', {
                  test: function () {
                    t.pass('NGN.BUS pooling works.')
                    NGN.BUS.once('attached.event', function () {
                      t.pass('NGN.BUS.attach() successfully triggered an event.')
                      t.ok(this.hasOwnProperty('event'), 'NGN.BUS events provide a self reference to the event name.')
                      t.ok(this.event === 'attached.event', 'NGN.BUS event name reference is correct.')

                      NGN.BUS.once('mature.queue', function () {
                        t.pass('NGN.BUS.queue successfully executed a unique delayed event.')
                        console.log(matureValue)
                        t.ok(matureValue === 3, 'NGN.BUS.queue triggered in the proper sequence.')
                        t.end()
                      })

                      var matureValue = 0
                      var ct = 0
                      var queueInterval = setInterval(function () {
                        NGN.BUS.queue('mature.queue', 700)
                        if (ct > 2) {
                          return clearInterval(queueInterval)
                        }
                        ct += 1
                        matureValue += 1
                      }, 125)
                    })

                    setTimeout(NGN.BUS.attach('attached.event'), 750)
                  }
                })

                NGN.BUS.emit('pool.test')
              })
            })
            NGN.BUS.once('bind.test.interim', function () {
              t.pass('NGN.BUS bind target 1 heard.')
            })
            NGN.BUS.once('bind.test.interim2', function () {
              t.pass('NGN.BUS bind target 2 heard.')
            })

            NGN.BUS.bind('bind.init', ['bind.test.interim', 'bind.test.interim2', 'bind.test.complete'])

            NGN.BUS.emit('bind.init')
          })
        })
        NGN.BUS.emit('testagain')
        setTimeout(function () {
          NGN.BUS.emit('testagain')
        }, 400)
      } else {
        setTimeout(function () {
          NGN.BUS.emit('testonce')
        }, 300)
      }
    })
    NGN.BUS.emit('testonce')
  })
  NGN.BUS.emit('test', {
    payload: 1
  })
})
