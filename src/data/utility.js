'use strict'

window.NGN = window.NGN || {}
window.NGN.DATA = window.NGN.DATA || {}
window.NGN.DATA.util = {}

Object.defineProperties(window.NGN.DATA.util, {
  // CRC table for checksum (cached)
  crcTable: NGN.define(false, true, false, null),

  /**
   * @method makeCRCTable
   * Generate the CRC table for checksums. This is a fairly complex
   * operation that should only be executed once and cached for
   * repeat use.
   * @private
   */
  makeCRCTable: NGN.define(false, false, false, function () {
    var c
    var crcTable = []
    for (var n = 0; n < 256; n++) {
      c = n
      for (var k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1))
      }
      crcTable[n] = c
    }
    return crcTable
  }),

  /**
   * @method checksum
   * Create the checksum of the specified string.
   * @param  {string} content
   * The content to generate a checksum for.
   * @return {string}
   * Generates a checksum value.
   */
  checksum: NGN.define(true, false, false, function (str) {
    var crcTable = this.crcTable || (this.crcTable = this.makeCRCTable())
    var crc = 0 ^ (-1)

    for (var i = 0; i < str.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF]
    }

    return (crc ^ (-1)) >>> 0
  })
})
