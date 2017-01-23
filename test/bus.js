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
                        NGN.BUS.delayEmit('mature.queue', 700)
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

            NGN.BUS.forward('bind.init', ['bind.test.interim', 'bind.test.interim2', 'bind.test.complete'])

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

test('NGN.BUS.chain', function (t) {
  NGN.BUS.chain(['a', 'b', 'c'], 'd', 'testValue')

  NGN.BUS.once('d', function (payload) {
    t.pass('Event triggered after collection is complete.')
    t.ok(payload === 'testValue', 'Proper payload sent to final event.')

    NGN.BUS.once('d', function (payload) {
      t.pass('Event triggered after collection is completed multiple times.')
      t.ok(payload === 'testValue', 'Proper payload sent to final event on each invocation.')

      t.end()
    })

    NGN.BUS.emit('a')
    NGN.BUS.emit('b')
    NGN.BUS.emit('c')
  })

  NGN.BUS.emit('b')

  setTimeout(function () {
    NGN.BUS.emit('a')
  }, 400)

  setTimeout(function () {
    NGN.BUS.emit('c')
  }, 900)
})

test('NGN.BUS.chainOnce', function (t) {
  NGN.BUS.chainOnce(['f', 'g', 'h', 'i'], 'j', 'testValue')

  NGN.BUS.once('j', function (payload) {
    t.pass('Event triggered after collection is complete.')
    t.ok(payload === 'testValue', 'Proper payload sent to final event.')

    var count = Object.keys(NGN.BUS.collectionQueue).filter(function (i) {
      return NGN.BUS.collectionQueue[i].masterqueue.join('') === 'abc' &&
        NGN.BUS.collectionQueue[i].eventName === 'd'
    }).length

    // One listener remains from prior test
    t.ok(count === 1, 'The event listeners were removed after the first invocation.')

    // Listen again. Make sure the event doesn't fire again. Fail if it does.
    NGN.BUS.once('j', function () {
      console.log('COLLECTION ON ERROR:', NGN.BUS.collectionQueue)
      t.fail('chainOnce final event triggered multiple times.')
    })

    NGN.BUS.emit('f')
    NGN.BUS.emit('g')
    NGN.BUS.emit('h')
    NGN.BUS.emit('i')

    setTimeout(function () {
      t.end()
    }, 300)
  })

  NGN.BUS.emit('f')
  NGN.BUS.emit('g')

  setTimeout(function () {
    NGN.BUS.emit('h')
  }, 400)

  setTimeout(function () {
    NGN.BUS.emit('i')
  }, 900)
})

test('NGN.BUS.threshold', {
  timeout: 2000
}, function (t) {
  NGN.BUS.threshold('threshold.test', 3, 'threshold.done')

  NGN.BUS.once('threshold.done', function (payload) {
    t.pass('Threshold final event triggered successfully.')

    NGN.BUS.once('threshold.done', function () {
      t.pass('Threshold successfully reset.')
      t.end()
    })

    NGN.BUS.emit('threshold.test')
    NGN.BUS.emit('threshold.test')
    NGN.BUS.emit('threshold.test')
  })

  NGN.BUS.emit('threshold.test')
  NGN.BUS.emit('threshold.test')
  NGN.BUS.emit('threshold.test')
})

test('NGN.BUS.thresholdOnce', {
  timeout: 2500
}, function (t) {
  NGN.BUS.thresholdOnce('threshold.test', 3, 'threshold.done.again', 'testValue')

  NGN.BUS.on('threshold.done.again', function (payload) {
    if (payload !== null) {
      t.pass('Threshold final event triggered successfully.')
      t.ok(payload === 'testValue', 'Proper payload sent to final event.')

      var count = Object.keys(NGN.BUS.thresholdQueue).filter(function (i) {
        return NGN.BUS.thresholdQueue[i].finalEventName === 'threshold.done'
      }).length

      // One listener remains from prior test
      t.ok(count === 1, 'The event listeners were removed after the first invocation.')

      NGN.BUS.once('threshold.done.again', function () {
        t.fail('Threshold not removed after completion.')
      })

      NGN.BUS.emit('threshold.test')
      NGN.BUS.emit('threshold.test')
      NGN.BUS.emit('threshold.test')
      NGN.BUS.emit('threshold.test')

      setTimeout(function () {
        t.pass('Threshold removed after first invocation.')
        t.end()
      }, 300)
    }
  })

  NGN.BUS.emit('threshold.test')
  NGN.BUS.emit('threshold.test')

  setTimeout(function () {
    NGN.BUS.emit('threshold.test')
  }, 300)
})
