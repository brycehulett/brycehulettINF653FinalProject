require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const middleware = require('./middleware');
const path = require('path')
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
//const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const connectDB = require("./config/dbConn");
const State = require('./model/States');
const {statesArray} = require('./config/statesArray');

// connect to mongodb
connectDB();

// setup
//app.use(cors(corsOptions));
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/', express.static(path.join(__dirname, '/public')));

// routes
app.use('/', require('./routes/rootRoute'));


// endpoints
app.get('/states', async(req, res) => {
    let ary = [...statesArray];
    
    if(req.query && req.query.contig){
        if(req.query.contig == 'true') {
            ary.splice(10,1);
            ary.splice(1,1);
        }
        else {
            ary = [ary[1], ary[10]];
        }
    }
    // loop thru array and add funfacts from db
    for(let i = 0; i < ary.length; i++){
        let data = ary[i];
        let result = await State.findOne({stateCode: data.code.toUpperCase()});
        if(result){
            ary[i] = {...data, funfacts: result.funfacts};
        }
    }

    return res.json(ary);
});

app.get('/states/:state', middleware.verifyStates, async(req, res) => {
    let data = statesArray[req.statesIndex];
    let result = await State.findOne({stateCode: data.code.toUpperCase()});
    if(result){
        data = {...data, funfacts: result.funfacts};
    }
    return res.json(data);
});

app.get('/states/:state/funfact', middleware.verifyStates, async(req, res) => {
    const result = await State.findOne({stateCode: statesArray[req.statesIndex].code.toUpperCase()});
    if(result){
        return res.json({funfacts: result.funfacts[Math.floor(Math.random() * result.funfacts.length)]});
    } 
    return res.status(400).json({"message": `No Fun Facts found for ${statesArray[req.statesIndex].state}`});
});

app.get('/states/:state/capital', middleware.verifyStates, (req, res) => {
    const data = statesArray[req.statesIndex];
    return res.json({state: data.state, capital: data.capital_city});
});

app.get('/states/:state/nickname', middleware.verifyStates, (req, res) => {
    const data = statesArray[req.statesIndex];
    return res.json({state: data.state, nickname: data.nickname});
});

app.get('/states/:state/population', middleware.verifyStates, (req, res) => {
    const data = statesArray[req.statesIndex];
    var formatter = new Intl.NumberFormat();
    return res.json({state: data.state, population: formatter.format(data.population)});
});

app.get('/states/:state/admission', middleware.verifyStates, (req, res) => {
    const data = statesArray[req.statesIndex];
    return res.json({state: data.state, admitted: data.admission_date});
});

app.post("/states/:state/funfact", middleware.verifyStates, async(req, res, next)=>{
    if(!req.body.funfact){
        return res.sendStatus(400).json({
            "message": "State fun facts value required"
        });
    }

    const data = statesArray[req.statesIndex];
    let result = await State.findOne({stateCode: data.code.toUpperCase()});

    if(!result){
        var postData = {
            stateCode: data.code.toUpperCase(),
            funfacts: req.body.funfacts
        }
        result =new State(postData);
    }else{
        result.funfacts = result.funfacts.concat(req.body.funfacts);
    }
    result.save()
    .then(() => {
        res.send(result);
    }).catch((e) => {
        res.status(400).send(e);
    });
})

app.delete("/states/:state/funfact", middleware.verifyStates, async(req, res, next)=>{
    if(!req.body.index){
        return res.status(400).json({
            "message": "State fun fact index value required"
        });
    }

    const data = statesArray[req.statesIndex];
    let result = await State.findOne({stateCode: data.code.toUpperCase()});

    if(!result){
        console.log("State has no fun facts to delete");
        return res.sendStatus(400);
        
    }
    if(req.body.index > result.funfacts.length || req.body.index <= 0){
        return res.status(404).json({"message": `No Fun Fact found at that index for ${data.state}`});
    }

    var ary = result.funfacts; 
    ary.splice(req.body.index, 1)  
    await State.updateOne({stateCode:data.code.toUpperCase()}, {$set : {funfacts : ary}});

    result.save()
    .then(() => {
        res.send(result);
    }).catch((e) => {
        res.status(400).send(e);
    });
})

app.patch("/states/:state/funfact", middleware.verifyStates, async(req, res, next)=>{
    if(!req.body.funfact){
        return res.status(400).json({"message": "State fun fact value required"});
    }
    if(!req.body.index){
        return res.status(400).json({"message": "State fun fact index value required"});
    }

    const data = statesArray[req.statesIndex];
    let result = await State.findOne({stateCode: data.code.toUpperCase()});

    if(!result){
        return res.status(404).json({"message": `No Fun Facts found for ${data.state}`});
    }
    
    if(!result || result.funfacts.length < req.body.index || req.body.index <= 0){
        return res.status(404).json({"message": `No Fun Fact found at that index for ${data.state}`});
    }
        
    result.funfacts[req.body.index -1] = req.body.funfact;
    
    result.save()
    .then(() => {
        res.send(result);
    }).catch((e) => {
        res.status(400).send(e);
    });
})

app.all('*', (req, res) => {
    res.status(404);
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'));
    } else if (req.accepts('json')) {
        res.json({ "error": "404 Not Found" });
    } else {
        res.type('txt').send("404 Not Found");
    }
});


mongoose.connection.once('open', () =>{
    console.log('Connected to MongoDB');
    const server = app.listen(port, ()=> console.log("Server listening on port " + port));
})
