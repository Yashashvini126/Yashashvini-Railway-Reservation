/* write a program to implement the crud operations using Express.js on JSON
Excecution:
1. To list students
http://localhost:3000/students
2. To insert students
In post man, in request body type
{"id" :22,
"name":"kiran"
}
POST http://localhost:3000/students

3a. Thru URL: To update student:-For students num1,name gets uploaded to Arun
PUT http://localhost:3000/students/1/Arun

3b. Thru POSTMAN BODY: To Update student:-For students num 1,name gets updated to Raja rao
PUT http://localhost:3000/students/1
In postman body type
{"id" :1,
"name": "Raja rao"
}

4. To delete a student 
DELETE http://localhost:3000/students/1
*/

const express = require("express");
const app = express();
app.use(express.json());
let students = [
    { id: 1, name: "Prem" },
    { id: 2, name: "Kumar" },
    { id: 3, name: "Ravi" },
    { id: 4, name: "Priya" }
];
// CREATE
app.post("/students", (req, res) => {
    students.push(req.body);
    res.send("Student Added");
});

// READ
app.get("/students", (req, res) => {
    res.json(students);
});
//To update thru URL
app.put("/students/:id/:name", (req, res) => {

    const student = students.find(s => s.id == req.params.id);

    if (student) {
        student.name = req.params.name;
        res.send("Student Updated");
    }
    else {
        res.send("Student Not Found");
    }
});

// UPDATE thru POSTMAN BODY
app.put("/students/:id", (req, res) => {

    const student = students.find(s => s.id == req.params.id);

    if(student){
        student.name = req.body.name;
        res.send("Student Updated");
    }
    else{
        res.send("Student Not Found");
    }

});

// DELETE
app.delete("/students/:id", (req, res) => {

    students = students.filter(s => s.id != req.params.id);
    res.send("Student Deleted");
});

app.listen(3000, () => {
    console.log("Server Running");
});
