const {statesArray} = require('./config/statesArray');

exports.verifyStates = (req, res, next) => {
    //console.log('middleware');

    const ary = statesArray.map(st => st.code);
    const result = ary.find(val => val.toLowerCase() === req.params.state.toLowerCase());

    if (!result) return res.sendStatus(401);

    req.statesIndex = ary.indexOf(result);
    return next();
}
