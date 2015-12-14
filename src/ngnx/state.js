'use strict'

/**
 * @inherits NGN.BUS
 * This user state management extension triggers events when the page
 * view changes (loading, navigates away, tab change, homescreen, etc).
 * It is a simple "semi-polyfill" that listens to the browser events
 * for desktop and mobile browsers, and responds in a standard way using
 * the NGN.BUS.
 * @fires state.change
 * Fired when the user state changes. Receives a payload of `visible`.
 * For example, to persist data when the user state changes:
 *
 * ```js
 * NGN.BUS.on('state.change', function (visible) {
 *   if (!visibile) {
 *     persistData()
 *   } else {
 *     restoreData()
 *   }
 * })
 * ```
 * @fires state.hidden
 * Fired when the state changes to "hidden". This means the
 * user switches tabs, apps, goes to homescreen, etc.
 * @fires state.visible
 * Fired when the state changes to "visible". This means the
 * user transitions from prerender, user returns to the app/tab, etc.
 */
if (!window.NGN.BUS) {
  console.warn('State management is inactive because NGN.BUS was not found.')
} else {
  window.NGNX = window.NGNX || {}
  NGN._od(NGNX, 'statechangerecorded', false, true, false, false)
  NGN.BUS.on('state.change', function (visible) {
    NGN.BUS.emit('state.' + (visible ? 'visible' : 'hidden'))
  })
  var statehandler = function () {
    if (!NGNX.statechangerecorded) {
      NGNX.statechangerecorded = true
      setTimeout(function () {
        NGNX.statechangerecorded = false
      }, 25)
      NGN.BUS.emit('state.change', document.visibilityState === 'visible')
    }
  }
  document.addEventListener('visibilitychange', statehandler)
  document.addEventListener('beforeunload', statehandler)
  document.addEventListener('pagehide', statehandler)
}
