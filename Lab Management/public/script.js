const settings = {
    equipment: {
        endpoint: '/api/equipment',
        id: 'equipment_id',
        title: 'Equipment',
        fields: [
            ['name', 'Name', 'text'],
            ['category', 'Category', 'text'],
            ['quantity', 'Quantity', 'number'],
            ['available_quantity', 'Available Quantity', 'number'],
            ['status', 'Status', 'select', ['Available', 'Issued', 'Maintenance']]
        ],
        columns: [
            ['equipment_id', 'ID'],
            ['name', 'Name'],
            ['category', 'Category'],
            ['quantity', 'Quantity'],
            ['available_quantity', 'Available'],
            ['status', 'Status']
        ]
    },

    users: {
        endpoint: '/api/users',
        id: 'user_id',
        title: 'User',
        fields: [
            ['name', 'Name', 'text'],
            ['email', 'Email', 'email'],
            ['password', 'Password', 'password'],
            ['role', 'Role', 'select', ['Student', 'Faculty', 'Lab Assistant', 'Admin']]
        ],
        columns: [
            ['user_id', 'ID'],
            ['name', 'Name'],
            ['email', 'Email'],
            ['role', 'Role']
        ]
    },

    issues: {
        endpoint: '/api/issues',
        id: 'issue_id',
        title: 'Issue Record',
        fields: [
            ['equipment_id', 'Equipment ID', 'number'],
            ['user_id', 'User ID', 'number'],
            ['issue_date', 'Issue Date', 'date'],
            ['return_date', 'Return Date', 'date'],
            ['quantity', 'Quantity', 'number'],
            ['status', 'Status', 'select', ['Issued', 'Returned', 'Overdue']]
        ],
        columns: [
            ['issue_id', 'ID'],
            ['equipment_id', 'Equipment ID'],
            ['user_id', 'User ID'],
            ['issue_date', 'Issue Date'],
            ['return_date', 'Return Date'],
            ['quantity', 'Quantity'],
            ['status', 'Status']
        ]
    }
};

async function openSection(section) {
    const config = settings[section];
    if (!config) return;

    const content = document.getElementById(section + '-content');
    if (!content) return;

    content.innerHTML = `
        <div class="crud-toolbar">
            <button class="crud-button" onclick="showForm('${section}')">
                + Add ${config.title}
            </button>
        </div>
        <p>Loading records...</p>
        <div id="${section}-table"></div>
        <div id="${section}-form"></div>
    `;

    await loadRecords(section);
}

async function loadRecords(section) {
    const config = settings[section];
    const table = document.getElementById(section + '-table');
    if (!table) return;

    table.innerHTML = '<p>Loading records...</p>';

    try {
        const response = await fetch(config.endpoint);
        const records = await response.json();

        if (!response.ok) {
            throw new Error(records.error || 'Could not load records');
        }

        if (records.length === 0) {
            table.innerHTML = '<p>No records found. Click Add to create one.</p>';
            return;
        }

        let html = '<div class="table-wrapper"><table><thead><tr>';

        config.columns.forEach(column => {
            html += `<th>${column[1]}</th>`;
        });

        html += '<th>Actions</th></tr></thead><tbody>';

        records.forEach(record => {
            const recordId = record[config.id];

            html += '<tr>';

            config.columns.forEach(column => {
                let value = record[column[0]] ?? '-';

                if (value instanceof Object) {
                    value = '-';
                }

                if (typeof value === 'string') {
                    value = value.replace('T00:00:00.000Z', '').slice(0, 10);
                }

                html += `<td>${escapeHTML(String(value))}</td>`;
            });

            html += `
                <td class="action-cell">
                    <button class="edit-button"
                        onclick="editRecord('${section}', ${Number(recordId)})">
                        Edit
                    </button>
                    <button class="delete-button"
                        onclick="deleteRecord('${section}', ${Number(recordId)})">
                        Delete
                    </button>
                </td>
            </tr>`;
        });

        html += '</tbody></table></div>';
        table.innerHTML = html;

    } catch (error) {
        table.innerHTML = `<p class="error-message">${escapeHTML(error.message)}</p>`;
    }
}

function escapeHTML(value) {
    return value.replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function showForm(section, record = {}) {
    const config = settings[section];
    const formContainer = document.getElementById(section + '-form');
    if (!formContainer) return;

    const isEditing = record[config.id] !== undefined;

    let html = `
        <div class="crud-form">
            <h3>${isEditing ? 'Edit' : 'Add'} ${config.title}</h3>
            <form id="${section}-record-form"
                onsubmit="saveRecord(event, '${section}', ${isEditing ? Number(record[config.id]) : 'null'})">
    `;

    config.fields.forEach(field => {
        const [name, label, type, options] = field;
        const value = record[name] ?? '';

        // Don't display the saved password while editing.
        if (name === 'password' && isEditing) {
            html += `
                <label>${label} (leave blank to keep current password)
                    <input name="${name}" type="password" autocomplete="new-password">
                </label>
            `;
            return;
        }

        html += `<label>${label}`;

        if (type === 'select') {
            html += `<select name="${name}" required>`;
            options.forEach(option => {
                html += `<option value="${escapeHTML(option)}"
                    ${String(value) === option ? 'selected' : ''}>
                    ${escapeHTML(option)}
                </option>`;
            });
            html += '</select>';
        } else {
            html += `<input name="${name}" type="${type}"
                value="${escapeHTML(String(value))}"
                ${type === 'number' ? 'min="0"' : ''}
                ${name === 'return_date' || name === 'password' ? '' : 'required'}>`;
        }

        html += '</label>';
    });

    html += `
                <div class="form-actions">
                    <button class="crud-button" type="submit">Save</button>
                    <button class="cancel-button" type="button"
                        onclick="closeForm('${section}')">Cancel</button>
                </div>
            </form>
        </div>
    `;

    formContainer.innerHTML = html;
    formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function editRecord(section, id) {
    const config = settings[section];

    fetch(config.endpoint)
        .then(response => response.json())
        .then(records => {
            const record = records.find(item => Number(item[config.id]) === Number(id));

            if (!record) {
                alert('Record not found.');
                return;
            }

            showForm(section, record);
        })
        .catch(() => alert('Could not open this record.'));
}

async function saveRecord(event, section, id) {
    event.preventDefault();

    const config = settings[section];
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (section === 'users' && id !== null && !data.password) {
        delete data.password;
    }

    if (section === 'issues' && !data.return_date) {
        data.return_date = null;
    }

    const isEditing = id !== null;
    const url = isEditing ? `${config.endpoint}/${id}` : config.endpoint;

    try {
        const response = await fetch(url, {
            method: isEditing ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Could not save record.');
        }

        alert(result.message || 'Saved successfully!');
        closeForm(section);
        await loadRecords(section);

    } catch (error) {
        alert(error.message);
    }
}

async function deleteRecord(section, id) {
    const config = settings[section];

    if (!confirm(`Are you sure you want to delete this ${config.title.toLowerCase()} record?`)) {
        return;
    }

    try {
        const response = await fetch(`${config.endpoint}/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Could not delete record.');
        }

        alert(result.message || 'Deleted successfully!');
        await loadRecords(section);

    } catch (error) {
        alert(error.message);
    }
}

function closeForm(section) {
    const formContainer = document.getElementById(section + '-form');
    if (formContainer) formContainer.innerHTML = '';
}