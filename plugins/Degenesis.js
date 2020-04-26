exports.command = function(userID, channelID, serverID, message, sender) {
    const Common = require('../Common.js');

    if (message.match(/^\-r \d+$/i)) {
        message += 'd6>3';
        let arg = Common.args(message)[0];
        let roller = create_roller(arg, serverID, userID);
        let botch = calcBotch(roller) ? ' (botched if failed)' : ''
        let triggers = roller.roll_list.filter(r => r === 6).length;
        sender(channelID, roller.output()+` (${triggers} triggers)`+botch, userID)
    } else if (message.match(/^\-rr \d+ \d+$/i)) {
        let text = Common.args(message)[0] + 'd6>3' || '';
        let count = Common.args(message)[1] || 1;
        let roller = create_roller(text, serverID, userID);
        let results = [];
        for (let i = 0; i < count; i++)
            results.push(roller.roll().output()+` (${roller.roll_list.filter(r => r === 6).length} triggers)`+(calcBotch(roller) ? ' (botched if failed)\n' : '\n'));
        sender(channelID, results, userID)
    } else return true;
}

function calcBotch(roller) {
    let ones = roller.roll_list.filter(r => r === 1).length;
    let successes = roller.roll_list.filter(r => r > 3).length;
    return ones > successes;
}

function create_roller(text, server, user) {
    const Roll = require('../Roll.js');
    text = text || '';
    let config = require('../config.json');
    return new Roll(text, config[server], config['*'], server, user);
}