const d = require('discord.io');
const auth = require('./auth.json');

const Roll = require('./Roll.js');
const Common = require('./Common.js');
const Help = require('./man.json');

const Storage = require('./Storage.json');

const PluginRegistry = require('./PluginMap.json');
const plugins = require('./plugins');

const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(3000);
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Headers', '*')
    res.setHeader('Access-Control-Allow-Origin', 'http://pinqiblo.com');
    next();
});
app.get('/BenBill/status', (req, res) => {
  res.send();
});



var Benbill = new d.Client({
	token: auth.token,
	autorun: true
})

// TODO:
//   1. Save command
//   2. Add character json
//   3. Crit feedback

app.post('/BenBill/roll', (req, res) => {
    let userId = req.body.userId;
    let channelId = req.body.channelId;
    let message = '-r ' + req.body.text;
    console.log('ROLL', req.body, userId, channelId, message);
    command(userId, channelId, message);
    res.send();
});

app.get('/BenBill/storage', (req, res) => {
    let channelId = req.query.channelId;
    let userId = req.query.userId;
    let serverId = getServer(channelId, userId);
    console.log(Storage, serverId, userId);
    res.send(Storage[serverId][userId]);
});

Benbill.on('message', (user, userID, channelID, message, evt) => {
    command(userID, channelID, message);
})

function command(userID, channelID, message) {
    try {
        let serverID = getServer(channelID, userID);

        let cont = true;
        for (let plug in plugins) {
            if (PluginRegistry[serverID] && PluginRegistry[serverID].includes(plug))
                cont = cont && plugins[plug].command(userID, channelID, serverID, message, send);
        }

        if (!cont) return;

        if (message.match(/^\-r($| )/i)) {
            let arg = Common.args(message)[0];
            send(channelID, create_roller(arg, serverID, userID).output(), userID)
        } else if (message.match(/^\-rr($| )/i)) {
            let text = Common.args(message)[0] || '';
            let count = Common.args(message)[1] || 1;
            let stack = Common.args(message)[2] || 0;
            let roller = create_roller(text, serverID, userID);
            let results = [];
            for (let i = 0; i < count; i++)
                results.push(roller.roll(i*stack).output());
            send(channelID, results, userID)
        } else if (message.match(/^\/avg($| )/i)) {
            let arg = Common.args(message)[0];
            let roller = create_roller(arg, serverID, userID);
            let data = [];
            for (let i = 0; i < 10000; i++)
                data.push(roller.roll().result);
            let sum = data.reduce((a, b) => a + b, 0)
            data.sort();
            send(channelID, 'Mean: `' + sum/10000.0 + '`\nMedian: `' + data[4999] + '`')
        } else if (message.match(/^\/save /i)){
            store(serverID, userID, Common.args(message)[0], Common.args(message)[1]);
            write_storage();
            send(channelID, `\`${Common.args(message)[0]}: ${Common.args(message)[1]}\` saved.`, userID)
        } else if (message.match(/^\/view /i) || message.match(/^\$.+\s*$/)){
            let tag = '';
            if (message[0] === '$')
                tag = message.trim().slice(1);
            else
                tag = Common.args(message)[0];
            let value = read(serverID, userID, tag);
            send(channelID, value);
        } else if (message.match(/^\/dm($| )/i)) {
            send(userID, 'DM ' + userID)
        } else if (message.match(/^\/web($| )/i)) {
            send(userID, `http://pinqiblo.com?c=${channelID}&u=${userID}`)
        } else if (message.match(/^\/load /)) {
            authorize(Common.args(message)[1]);
            load_plugin(serverID, Common.args(message)[0]);
            write_plugins();
            send(channelID, 'Loaded ' + Common.args(message)[0], userID)
        } else if (message.match(/^\/unload /)) {
            authorize(Common.args(message)[1]);
            unload_plugin(serverID, Common.args(message)[0]);
            write_plugins();
            send(channelID, 'Unloaded ' + Common.args(message)[0], userID)
        } else if (message.match(/^\/config /)) {
            let args = Common.args(message);
            authorize(args.auth);
            write_config(serverID, args);
            let configStr = '';
            let value = '';
            for (let i = 0; args[i+1]; i++)
                if (args[i+2])
                    configStr += `${args[i]} -> `;
                else {
                    configStr += args[i];
                    value = args[i+1]
                }
            send(channelID, `Configured \`${configStr}\` to **${value}**`, userID)
        } else if (message.match(/^\/help($| )/)) {
            let arg = Common.args(message)[0];
            if (arg && (arg in Help))
                send(userID, Help[arg]);
            else
                send(userID, Help["*"]);
        }
    } catch(e) {
        Benbill.sendMessage({
            to: "263713926376587264",
            message: e.message
        });
        console.log(message, e);
    }
}

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

    let config = require('./config.json');
    return new Roll(text, config[server], config['*']);
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

function load_plugin(server, plugin) {
    if (!PluginRegistry[server])
        PluginRegistry[server] = [plugin];
    else if (!PluginRegistry[server].includes(plugin))
        PluginRegistry[server].push(plugin);
}

function unload_plugin(server, plugin) {
    if (PluginRegistry[server] && PluginRegistry[server].includes(plugin))
        PluginRegistry[server].splice(PluginRegistry[server].indexOf(plugin));
}

function write_plugins() {
    fs.writeFile('PluginMap.json', JSON.stringify(PluginRegistry),
     (err) => {
        if (err) throw err;
     });
}

function write_config(serverID, args) {
    let config = require('./config.json');
    if (!config[serverID]) config[serverID] = {};

    let configPtr = config[serverID];
    for (let i = 0; args[i+1]; i++) {
        if (!configPtr[args[i]])
            configPtr[args[i]] = {};
        if (args[i+2])
            configPtr = configPtr[args[i]];
        else
            configPtr[args[i]] = args[i+1];
    }
    
    fs.writeFile('config.json', JSON.stringify(config),
    (err) => {
        if (err) throw err;
    });
}

function authorize(code) {
    let data = fs.readFileSync('auth.txt');
    if (code !== data.toString().trim())
        throw  new Error('Unauthed code: ' + code);

    fs.writeFile('auth.txt', newAuthCode(), 
    (err) => {
        if (err) throw err;
    });
}

function newAuthCode() {
    let code = '';
    for (let i = 0; i < 64; i++) {
        let c = String.fromCharCode(Math.floor(Math.random()*26)+65);
        code += c;
    }

    return code;
}

function getServer(channel, user) {
    if (Benbill.channels[channel])
        return Benbill.channels[channel].guild_id;
    else
        return user;
}