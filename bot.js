var d = require('discord.io');
var auth = require('./auth.json');
var Roll = require('./Roll.js');
var Storage = require('./Storage.json')
var fs = require('fs');
const express = require('express');
const app = express();

app.get('/BenBill/status', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.send();
});
app.listen(3000, () => console.log('Server running on port 3000'));


var Benbill = new d.Client({
	token: auth.token,
	autorun: true
})

// TODO:
//   1. Save command
//   2. Add character json
//   3. Crit feedback

/*
let server_channels = [];

Benbill.on('ready', () => {
    for (let s in Benbill.servers)
        server_channels.push(Benbill.servers[s]);

    server_channels = server_channels.map(s => Object.keys(s.channels)).flat();
});*/

Benbill.on('message', (user, userID, channelID, message, evt) => {
    try {
        let serverID = 0;
        if (Benbill.channels[channelID])
            serverID = Benbill.channels[channelID].guild_id;
        else
            serverID = userID;

        if (message.match(/^\/r($| )/i)) {
            let arg = args(message)[0];
            send(channelID, create_roller(arg, serverID, userID).output(), userID)
        } else if (message.match(/^\/rr($| )/i)) {
            let text = args(message)[0] || '';
            let count = args(message)[1] || 1;
            let stack = args(message)[2] || 0;
            let roller = create_roller(text, serverID, userID);
            let results = [];
            for (let i = 0; i < count; i++)
                results.push(roller.roll(i*stack).output());
            send(channelID, results, userID)
        } else if (message.match(/^\/avg($| )/i)) {
            let arg = args(message)[0];
            let roller = create_roller(arg, serverID, userID);
            let data = [];
            for (let i = 0; i < 10000; i++)
                data.push(roller.roll().result);
            let sum = data.reduce((a, b) => a + b, 0)
            data.sort();
            send(channelID, 'Mean: `' + sum/10000.0 + '`\nMedian: `' + data[4999] + '`')
        } else if (message.match(/^\/save /i)){
            store(serverID, userID, args(message)[0], args(message)[1]);
            write_storage();
            send(channelID, `\`${args(message)[0]}: ${args(message)[1]}\` saved.`, userID)
        } else if (message.match(/^\/view /i)){
            let value = read(serverID, userID, args(message)[0]);
            send(channelID, '`' + value + '`', userID);
        } else if (message.match(/^\/dm($| )/i)) {
            send(userID, 'DM')
        } else if (message.match(/^\/web($| )/i)) {
            send(userID, `http://pinqiblo.com?s=${serverID}&u=${userID}`)
        }/* else {

            let skill = new Skill(message)
            if (skill.valid) {
                Benbill.sendMessage({
                    to: channelID,
                    message: "<@" + userID + ">\n" + skill.use()
                });
            }
        }*/
    } catch(e) {
        Benbill.sendMessage({
            to: channelID,
            message: 'The bot has encountered an error. Please inform Ben if he is not around.'
        });
        console.log(e);
    }
})

function send(channel, message, user) {
    Benbill.sendMessage({
        to: channel,
        message: (user ? `<@${user}>\n` : '') + message
    });
}

function create_roller(text, server, user) {
    text = text || '';

    let relevant_storage = {};
    if (Storage[server]
        && Storage[server][user])
        relevant_storage = Storage[server][user];

    while (text.match(/\$\w*/i)) {
        let m_key = text.match(/\$\w*/i);
        let key = m_key[0].slice(1).toLowerCase();
        let value = Storage[server][user][key] || '';

        text = text.replace(m_key[0], value)
    }

    return new Roll(text);
}

function args(command) {
    let args = command.split(' ');
    return args.slice(1)
}

function store(server, user, key, value) {
    if (!Storage[server])
        Storage[server] = {};
    if (!Storage[server][user])
        Storage[server][user] = {};
    Storage[server][user][key.toLowerCase()] = value;
}

function write_storage() {
    fs.writeFile('Storage.json', JSON.stringify(Storage),
     (err) => {
        if (err) throw err;
     });
}

function read(server, user, key) {
    if (Storage[server]
        && Storage[server][user]
        && Storage[server][user][key] !== undefined)
        return Storage[server][user][key];
    else
        return `Key '${key}' does not exist on this server for you`
}