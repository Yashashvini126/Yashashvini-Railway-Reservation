//write a program to implement "Hello world" message in the route throgh the browser using express
const express = require("express");
const app =express();
app.get("/",(req,res)=> {
    res.send("Hello World");
});
app.listen(3000,()=>{
    console.log("Server running on port 3000");
});