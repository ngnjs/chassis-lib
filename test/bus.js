'use strict'

var test = require('tape')

test('NGN.BUS', function (t) {
  NGN.BUS.subscribe('test', function (data) {
    t.pass('NGN.BUS.publish() and NGN.BUS.emit() both firing events properly.')
    t.pass('NGN.BUS subscribed to basic event.')
    t.ok(data.payload === 1, 'NGN.BUS received event with data payload.')

    var heard = 0
    var total = 0
    NGN.BUS.subscribeOnce('testonce', function () {
      heard++
    })
    NGN.BUS.subscribe('testonce', function () {
      total++

      if (total > 1) {
        t.ok(heard === 1, 'NGN.BUS one-time event handler works.')

        NGN.BUS.once('testagain', function () {
          t.pass('NGN.BUS.once() alias works.')
          NGN.BUS.on('testagain', function () {
            t.pass('NGN.BUS.on() alias works.')

            NGN.BUS.once('bind.test.complete', function () {
              t.pass('NGN.BUS bind target 3 heard.')
              setTimeout(function () {
                NGN.BUS.once('notcalled', function () {})
                t.ok(NGN.BUS.persistentSubscribers.length === 3, 'NGN.BUS.persistentSubscribers returns proper number of regular subscribers.')
                t.ok(NGN.BUS.adhocSubscribers.length === 1, 'NGN.BUS.adhocSubscribers returns proper number of adhoc subscribers.')
                t.ok(NGN.BUS.autoSubscribers.length === 1, 'NGN.BUS.autoSubscribers returns proper number of bound subscribers.')
                t.ok(Object.keys(NGN.BUS.subscribers).length === 4, 'NGN.BUS.subscribers returns correct number of total subscribers.')

                NGN.BUS.pool('pool.', {
                  test: function () {
                    t.pass('NGN.BUS pooling works.')
                    NGN.BUS.on('attached.event', function () {
                      t.pass('NGN.BUS.attach() successfully triggered an event.')
                      t.ok(this.hasOwnProperty('eventName'), 'NGN.BUS events provide a self reference to the event name.')
                      t.ok(this.eventName === 'attached.event', 'NGN.BUS event name reference is correct.')
                      t.end()
                    })
                    setTimeout(NGN.BUS.attach('attached.event'), 300)
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
