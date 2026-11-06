
const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1266',
    database: 'yashashvini_lab'
});

db.connect((err) => {
    if (err) {
        console.log('MySQL connection failed:', err.message);
        return;
    }
    console.log('MySQL connected successfully!');
});

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==============================
// EQUIPMENT
// ==============================

// View equipment
app.get('/api/equipment', (req, res) => {
    db.query('SELECT * FROM equipment', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Add equipment
app.post('/api/equipment', (req, res) => {
    const { name, category, quantity, available_quantity, status } = req.body;

    if (!name || !category || quantity === undefined ||
        available_quantity === undefined || !status) {
        return res.status(400).json({
            error: 'Fill in all equipment fields.'
        });
    }

    db.query(
        `INSERT INTO equipment
        (name, category, quantity, available_quantity, status)
        VALUES (?, ?, ?, ?, ?)`,
        [name, category, quantity, available_quantity, status],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({
                message: 'Equipment added successfully!',
                id: result.insertId
            });
        }
    );
});

// Edit equipment
app.put('/api/equipment/:id', (req, res) => {
    const { name, category, quantity, available_quantity, status } = req.body;

    if (!name || !category || quantity === undefined ||
        available_quantity === undefined || !status) {
        return res.status(400).json({
            error: 'Fill in all equipment fields.'
        });
    }

    db.query(
        `UPDATE equipment
         SET name = ?, category = ?, quantity = ?,
             available_quantity = ?, status = ?
         WHERE equipment_id = ?`,
        [name, category, quantity, available_quantity, status, req.params.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: 'Equipment not found.'
                });
            }
            res.json({ message: 'Equipment updated successfully!' });
        }
    );
});

// Delete equipment
app.delete('/api/equipment/:id', (req, res) => {
    db.query(
        'DELETE FROM equipment WHERE equipment_id = ?',
        [req.params.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    error: 'Could not delete equipment. It may be linked to issue records.'
                });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: 'Equipment not found.'
                });
            }
            res.json({ message: 'Equipment deleted successfully!' });
        }
    );
});

// ==============================
// USERS
// ==============================

// View users, including status (never send passwords)
app.get('/api/users', (req, res) => {
    db.query(
        'SELECT user_id, name, email, role, status FROM users',
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        }
    );
});

// Add user
app.post('/api/users', (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({
            error: 'Fill in name, email, password, and role.'
        });
    }

    db.query(
        `INSERT INTO users (name, email, password, role)
         VALUES (?, ?, ?, ?)`,
        [name, email, password, role],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({
                message: 'User added successfully!',
                id: result.insertId
            });
        }
    );
});

// Edit user details
app.put('/api/users/:id', (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !role) {
        return res.status(400).json({
            error: 'Name, email, and role are required.'
        });
    }

    const sql = password
        ? `UPDATE users
           SET name = ?, email = ?, password = ?, role = ?
           WHERE user_id = ?`
        : `UPDATE users
           SET name = ?, email = ?, role = ?
           WHERE user_id = ?`;

    const values = password
        ? [name, email, password, role, req.params.id]
        : [name, email, role, req.params.id];

    db.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json({ message: 'User updated successfully!' });
    });
});

// Activate or deactivate a user without deleting their record
app.put('/api/users/:id/status', (req, res) => {
    const { status } = req.body;

    if (!['Active', 'Inactive'].includes(status)) {
        return res.status(400).json({
            error: 'Status must be Active or Inactive.'
        });
    }

    db.query(
        'UPDATE users SET status = ? WHERE user_id = ?',
        [status, req.params.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: 'User not found.'
                });
            }
            res.json({
                message: `User ${status === 'Active' ? 'activated' : 'deactivated'} successfully!`,
                status
            });
        }
    );
});

// Delete user (may be prevented by linked issue records)
app.delete('/api/users/:id', (req, res) => {
    db.query(
        'DELETE FROM users WHERE user_id = ?',
        [req.params.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    error: 'Could not delete user. They may be linked to issue records.'
                });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: 'User not found.'
                });
            }
            res.json({ message: 'User deleted successfully!' });
        }
    );
});

// ==============================
// ISSUE RECORDS
// ==============================

// View issue records
app.get('/api/issues', (req, res) => {
    db.query(
        `SELECT issue_id, equipment_id, user_id, issue_date,
                return_date, quantity, status
         FROM issue_records`,
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        }
    );
});

// Add issue record
app.post('/api/issues', (req, res) => {
    let {
        equipment_id, user_id, issue_date,
        return_date, quantity, status
    } = req.body;

    if (!equipment_id || !user_id || !issue_date ||
        quantity === undefined || quantity === '' || !status) {
        return res.status(400).json({
            error: 'Fill in all required issue fields.'
        });
    }

    return_date = return_date || null;

    db.query(
        `INSERT INTO issue_records
         (equipment_id, user_id, issue_date, return_date, quantity, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [equipment_id, user_id, issue_date, return_date, quantity, status],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({
                message: 'Issue record added successfully!',
                id: result.insertId
            });
        }
    );
});

// Edit issue record
app.put('/api/issues/:id', (req, res) => {
    let {
        equipment_id, user_id, issue_date,
        return_date, quantity, status
    } = req.body;

    if (!equipment_id || !user_id || !issue_date ||
        quantity === undefined || quantity === '' || !status) {
        return res.status(400).json({
            error: 'Fill in all required issue fields.'
        });
    }

    return_date = return_date || null;

    db.query(
        `UPDATE issue_records
         SET equipment_id = ?, user_id = ?, issue_date = ?,
             return_date = ?, quantity = ?, status = ?
         WHERE issue_id = ?`,
        [
            equipment_id, user_id, issue_date, return_date,
            quantity, status, req.params.id
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: 'Issue record not found.'
                });
            }
            res.json({
                message: 'Issue record updated successfully!'
            });
        }
    );
});

// Delete issue record
app.delete('/api/issues/:id', (req, res) => {
    db.query(
        'DELETE FROM issue_records WHERE issue_id = ?',
        [req.params.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: 'Issue record not found.'
                });
            }
            res.json({
                message: 'Issue record deleted successfully!'
            });
        }
    );
});

// ==============================
// DASHBOARD STATISTICS
// ==============================

app.get('/api/dashboard', (req, res) => {
    const sql = `
        SELECT
            (SELECT COUNT(*) FROM equipment) AS totalEquipment,
            (SELECT COUNT(*) FROM users) AS totalUsers,
            (SELECT COUNT(*) FROM issue_records) AS totalIssues,
            (SELECT COALESCE(SUM(available_quantity), 0)
             FROM equipment) AS availableEquipment
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results[0]);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
