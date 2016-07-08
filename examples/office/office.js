// hide body to prevent FOUC
document.body.style.opacity = 0;
window.addEventListener('WebComponentsReady', function() {
  setTimeout(function () {
    document.body.style.opacity = 1;
  }, 100)
});

const editEmployeeDialog = document.querySelector('chassis-overlay[name="editEmployee"]'),
  addEmployeeDialog = document.querySelector('chassis-overlay[name="addEmployee"]');

// create the employee model
const Employee = new NGN.DATA.Model({
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
      return `${this.first} ${this.last}`;
    },
    age: function (e) {
      return moment().diff(moment(this.dob), 'years');
    }
  }
});

// create the employee store
EmployeeStore = new NGN.DATA.Store({
  model: Employee,
  allowDuplicates: false
});

//pre-populate the employee list
const employees = [{
  first: 'Michael',
  last: 'Skott',
  dob: '1973-08-14'
},{
  first: 'Jim',
  last: 'Haplert',
  dob: moment().year('1978').format('YYYY-MM-DD')
},{
  first: 'Stanley',
  last: 'Hudson',
  dob: '1965-08-14'
}];

/**
 * Set click handlers for an array of elements
 * @param {String} type
 * @param {Array} elements An array of dom elements to add handlers to
 */
function setHandlers (type, elements) {
  elements = elements || [];
  elements.forEach(el => {
    el.onclick = (e) => {
      const data = e.currentTarget.dataset,
        model = EmployeeStore.find(data.id);
      if (type === 'undo') {
        model.undo(3); // each update modifies 3 fields
        refreshEmployees();
      }
      else if (type === 'remove') {
        removeEmployee(data.id);
      }
      else if (type === 'edit') {
        document.querySelector('input[name="editName"]').value = data.name;
        document.querySelector('input[name="editDob"]').value = data.dob;
        document.querySelector('input[name="id"]').value = data.id;
        editEmployeeDialog.open();
      }
    };
  })
}

/**
 * Refresh the employee list and set the handlers
 */
function refreshEmployees (filter) {
  document.getElementById('employees').innerHTML = getEmployeesHtml(filter);
  // set the onclick handlers for undo and remove buttons
  // setHandlers('undo', document.querySelectorAll('button[name="undo"]'));
  // setHandlers('remove', document.querySelectorAll('button[name="remove"]'));
  // setHandlers('edit', document.querySelectorAll('button[name="editEmployee"]'));
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
  const model = EmployeeStore.find(modelId);
  model.first = data.first;
  model.last = data.last;
  model.dob = data.dob;
  refreshEmployees();
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
  addEvents(EmployeeStore.add(data));
  EmployeeStore.sort({
    last: 'asc'
  })
}

/**
 * Remove an employee model from the store and refresh the view
 *
 * @param {String} id
 */
function removeEmployee (id) {
  const model = EmployeeStore.find(id),
    index = EmployeeStore.indexOf(model);
  EmployeeStore.remove(index);
  refreshEmployees();
}

// modify the submit buttons of the dialogs
document.querySelector('button[name="submitEditDialog"]').onclick = function (e) {
  const data = {
    first: document.querySelector('input[name="editName"]').value.split(' ')[0],
    last: document.querySelector('input[name="editName"]').value.split(' ')[1] || '',
    dob: document.querySelector('input[name="editDob"]').value
  };
  editEmployee(document.querySelector('input[name="id"]').value, data);
  editEmployeeDialog.close();
};

document.querySelector('button[name="submitAddDialog"]').onclick = function (e) {
  const data = {
    first: document.querySelector('input[name="addName"]').value.split(' ')[0],
    last: document.querySelector('input[name="addName"]').value.split(' ')[1] || '',
    dob: document.querySelector('input[name="addDob"]').value
  };
  addEmployee(data);
  addEmployeeDialog.close();
};

document.querySelector('button[name="closeEditDialog"]').onclick = function (e) {
  editEmployeeDialog.close();
}
document.querySelector('button[name="closeAddDialog"]').onclick = function (e) {
  addEmployeeDialog.close();
}

employees.forEach(function(e) {
  addEmployee(e);
});

function addEvents (model) {
  let events = [
    'field.update',
    'field.create',
    'field.remove',
    'field.invalid',
    'validator.add',
    'validator.remove',
    'relationship.create',
    'relationship.remove'
  ];
  events.forEach(function(event) {
    model['on'](event, (e) => {
      console.log(e);
      if (event.search(/field/) >= 0) {
        refreshEmployees();
      }
    });
  });
}

function getEmployeesHtml () {
  EmployeeStore.clearFilters();
  const filterVal = document.querySelector('input[name="filter"]').value,
    regex = new RegExp(filterVal, 'i')
  EmployeeStore.addFilter(function(employee) {
    return !filterVal || employee.first.search(regex) >= 0 || employee.last.search(regex) >= 0;
  });
  let employees = EmployeeStore.data;

  let html = '';

  employees.forEach(employee => {
    let htmlClass = 'employeeData',
      birthday = false;
    employee = EmployeeStore.find(employee.id);

    if (moment().date() === moment(employee.dob).date() &&
      moment().month() === moment(employee.dob).month()) {
      birthday = true;
      htmlClass += ' birthday';
    }
    html += `<div class="employee">
      <div class="${htmlClass}">
        Name: ${employee.fullName}<br>
        Dob: ${moment(employee.dob).format('YYYY-MM-DD')}
        ${birthday ? '<br> Happy Birthday (' + employee.age + ') ' + employee.first + '!' : ''}
      </div>
      <button name="editEmployee" data-id="${employee.id}"
        data-name="${employee.fullName}" data-dob="${moment(employee.dob).format('YYYY-MM-DD')}">Edit</button>
      <button name="undo" data-id="${employee.id}">Undo</button>
      <button name="remove" data-id="${employee.id}">Clock Out</button>
    </div>`;
});
  return html;
}

document.getElementById('clockIn').onclick = function() {
  addEmployeeDialog.open();
};

document.querySelector('button[name="clearFilter"]').onclick = function() {
  document.querySelector('input[name="filter"]').value = '';
  refreshEmployees();
};

document.querySelector('input[name="filter"]').onkeyup = function (e) {
  refreshEmployees();
}

refreshEmployees();
