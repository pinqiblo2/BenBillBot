exports.command = function(userID, channelID, serverID, message, sender) {
    const Common = require('../Common.js');

    if (message.match(/^\-r \d+$/i)) {
        message += 'd6>3';
        let arg = Common.args(message)[0];
        let roller = create_roller(arg, serverID, userID);
        sender(channelID, roller.output()+calcTriggers(roller)+calcBotch(roller), userID)
    } else if (message.match(/^\-rr \d+ \d+$/i)) {
        let text = Common.args(message)[0] + 'd6>3' || '';
        let count = Common.args(message)[1] || 1;
        let roller = create_roller(text, serverID, userID);
        let results = [];
        for (let i = 0; i < count; i++)
            results.push(roller.roll().output()+calcTriggers(roller)+calcBotch(roller)+'\n');
        sender(channelID, results, userID)
    } else return true;
}

function calcBotch(roller) {
    let ones = roller.roll_list.filter(r => r === 1).length;
    let successes = roller.roll_list.filter(r => r > 3).length;
    return ones > successes ? ' (botched if failed)' : ''
}

function calcTriggers(roller) {
    let count = roller.roll_list.filter(r => r === 6).length;
    return count > 0 ? count > 1 ? ` (${count} triggers)` : '1 trigger' : '';
}

function create_roller(text, server, user) {
    const Roll = require('../Roll.js');
    text = text || '';
    let config = require('../config.json');
    return new Roll(text, config[server], config['*'], server, user);
}