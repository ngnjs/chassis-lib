// hide body to prevent FOUC
document.body.style.opacity = 0
window.addEventListener('WebComponentsReady', function () {
  setTimeout(function () {
    document.body.style.opacity = 1
  }, 100)
})

// set the dialog boxes to vars
var editEmployeeDialog = document.querySelector('chassis-overlay[name="editEmployee"]')
var addEmployeeDialog = document.querySelector('chassis-overlay[name="addEmployee"]')

// create the employee model
var Employee = new NGN.DATA.Model({
  autoid: true,
  fields: {
    first: {
      type: String
    },
    last: {
      type: String
    },
    dob: {
      type: Date
    }
  },
  virtuals: {
    fullName: function () {
      return this.first + ' ' + this.last
    },
    age: function (e) {
      return moment().diff(moment(this.dob), 'years') // eslint-disable-line no-undef
    }
  }
})

// create the employee store
var EmployeeStore = new NGN.DATA.Store({
  model: Employee,
  allowDuplicates: false
})

// pre-populate the employee list
var employees = [{
  first: 'Michael',
  last: 'Skott',
  dob: '1973-08-14'
}, {
  first: 'Jim',
  last: 'Haplert',
  dob: moment().year('1978').format('YYYY-MM-DD') // eslint-disable-line no-undef
}, {
  first: 'Stanley',
  last: 'Hudson',
  dob: '1965-08-14'
}]

/**
 * Set click handlers for an array of elements
 * @param {String} type
 * @param {Array} elements An array of dom elements to add handlers to
 */
function setHandlers (type, elements) {
  elements = elements || []
  elements.forEach(function (el) {
    el.onclick = function (e) {
      var data = e.currentTarget.dataset
      var model = EmployeeStore.find(data.id)
      if (type === 'undo') {
        model.undo(3) // each update modifies 3 fields
        refreshEmployees()
      } else if (type === 'remove') {
        removeEmployee(data.id)
      } else if (type === 'edit') {
        document.querySelector('input[name="editName"]').value = data.name
        document.querySelector('input[name="editDob"]').value = data.dob
        document.querySelector('input[name="id"]').value = data.id
        editEmployeeDialog.open()
      }
    }
  })
}

/**
 * Refresh the employee list and set the handlers
 */
function refreshEmployees () {
  document.getElementById('employees').innerHTML = getEmployeesHtml()
  // set the onclick handlers for undo and remove buttons
  setHandlers('undo', document.querySelectorAll('button[name="undo"]'))
  setHandlers('remove', document.querySelectorAll('button[name="remove"]'))
  setHandlers('edit', document.querySelectorAll('button[name="editEmployee"]'))
}

/**
 * Edit the employee model and refresh the view
 *
 * @param {String} modelId
 * @param {Object} data
 * @param {String} data.first
 * @param {String} data.last
 * @param {String} data.dob
 */
function editEmployee (modelId, data) {
  var model = EmployeeStore.find(modelId)
  model.first = data.first
  model.last = data.last
  model.dob = data.dob
  refreshEmployees()
}

/**
 * Add an employee model to the store, set all event listeners on the model,
 * and refresh the view
 *
 * @param {Object} data
 * @param {String} data.first
 * @param {String} data.last
 * @param {String} data.dob
 */
function addEmployee (data) {
  addEvents(EmployeeStore.add(data))
  refreshEmployees()
}

/**
 * Remove an employee model from the store and refresh the view
 *
 * @param {String} id
 */
function removeEmployee (id) {
  var model = EmployeeStore.find(id)
  var index = EmployeeStore.indexOf(model)
  EmployeeStore.remove(index)
  refreshEmployees()
}

// Take the provided data, modify the employee, and close the dialog
document.querySelector('button[name="submitEditDialog"]').onclick = function (e) {
  var data = {
    first: document.querySelector('input[name="editName"]').value.split(' ')[0],
    last: document.querySelector('input[name="editName"]').value.split(' ')[1] || '',
    dob: document.querySelector('input[name="editDob"]').value
  }
  editEmployee(document.querySelector('input[name="id"]').value, data)
  editEmployeeDialog.close()
}

// Take the provided data, add the new employee, and close/clear the dialog
document.querySelector('button[name="submitAddDialog"]').onclick = function (e) {
  var data = {
    first: document.querySelector('input[name="addName"]').value.split(' ')[0],
    last: document.querySelector('input[name="addName"]').value.split(' ')[1] || '',
    dob: document.querySelector('input[name="addDob"]').value
  }
  addEmployee(data)
  // close and clear the dialog
  document.querySelector('button[name="closeAddDialog"]').click()
}

// Close the edit dialog
document.querySelector('button[name="closeEditDialog"]').onclick = function (e) {
  editEmployeeDialog.close()
}

// Close the add dialog and clear the values on the input
document.querySelector('button[name="closeAddDialog"]').onclick = function (e) {
  document.querySelector('input[name="addName"]').value = ''
  document.querySelector('input[name="addDob"]').value = ''
  addEmployeeDialog.close()
}

// Add each employee to the store
employees.forEach(function (e) {
  addEmployee(e)
})

/**
 * Add event handling to a givel model
 *
 * @param {Object} model An instance of an NGN model
 */
function addEvents (model) {
  var events = [
    'field.update',
    'field.create',
    'field.remove',
    'field.invalid',
    'validator.add',
    'validator.remove',
    'relationship.create',
    'relationship.remove'
  ]
  events.forEach(function (event) {
    model['on'](event, function (e) {
      console.log(e)
      if (event.search(/field/) >= 0) {
        refreshEmployees()
      }
    })
  })
}

function filterAndSortRecords () {
  EmployeeStore.clearFilters()
  var filterVal = document.querySelector('input[name="filter"]').value
  var regex = new RegExp(filterVal, 'i')
  EmployeeStore.addFilter(function (employee) {
    return !filterVal || employee.first.search(regex) >= 0 || employee.last.search(regex) >= 0
  })
  EmployeeStore.sort({
    last: 'asc',
    first: 'asc'
  })
}

/**
 * Apply filtering and sorting to the data store, before returning
 * the appropriate HTML for refreshing the employees currently clocked in
 *
 * @return {String} HTML
 */
function getEmployeesHtml () {
  filterAndSortRecords()
  // This function is broken right now in conjunction with addFilter. We'll do a hacky sort manually
  var employees = EmployeeStore.records

  var html = ''

  employees.forEach(function (employee) {
    var htmlClass = 'employeeData'
    var birthday = false
    employee = EmployeeStore.find(employee.id)

    /* eslint-disable no-undef */
    if (moment().date() === moment(employee.dob).date() &&
      moment().month() === moment(employee.dob).month()) {
      birthday = true
      htmlClass += ' birthday'
    }

    html += '<div class="employee">' +
      '<div class="' + htmlClass + '">' +
        'Name: ' + employee.fullName + '<br>' +
        'Dob: ' + moment(employee.dob).format('YYYY-MM-DD') +
        (birthday ? '<br> Happy Birthday (' + employee.age + ') ' + employee.first + '!' : '') +
      '</div>' +
      '<button name="editEmployee" data-id="' + employee.id + '"' +
        'data-name="' + employee.fullName + '" data-dob="' + moment(employee.dob).format('YYYY-MM-DD') + '">Edit</button>' +
      '<button name="undo" data-id="' + employee.id + '">Undo</button>' +
      '<button name="remove" data-id="' + employee.id + '">Clock Out</button>' +
   ' </div>'
  })
  return html
  /* eslint-enable */
}

// open the addEmployee dialog
document.getElementById('clockIn').onclick = function () {
  addEmployeeDialog.open()
}

// clear the filter input text box and refresh the employee list
document.querySelector('button[name="clearFilter"]').onclick = function () {
  document.querySelector('input[name="filter"]').value = ''
  refreshEmployees()
}

// filter the employees by name, given a filter input
document.querySelector('input[name="filter"]').onkeyup = function (e) {
  refreshEmployees()
}

// initialize the employee list
refreshEmployees()
