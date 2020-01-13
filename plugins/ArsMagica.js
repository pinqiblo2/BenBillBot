const Spells = require('./Spells.json')

exports.command = function(userID, channelID, serverID, message, sender) {
    const Common = require('./Common.js');

    if (message.match(/^\/spell /i)) {
        argList = Common.args(message);
        knownParams = ['name', 'arts', 'range', 'duration', 'target', 'level'];

        switch (argList[0]) {
            case 'create':
                // Note empty fields after creation
                // Set empty fields to lowest defaults
                if (!('name' in argList))
                    return sender(channelID, 'The spell needs a name', userID)

                spell = {
                    arts: 'creo animal',
                    range: 'personal',
                    duration: 'momentary',
                    target: 'individual',
                    level: 1
                };
                notes = [];

                for (let param in argList) {
                    if (knownParams.includes(param))
                        spell[param] = argList[param];
                }

                for (let i in knownParams)
                    if (!(knownParams[i] in argList))
                        notes.push(`Argument **${knownParams[i]}** was missing, defaulted to **${spell[knownParams[i]]}**.`);
                
                write_spell(spell, userID, serverID)

                notes.push(`Spell **${spell.name}** saved.`);
                sender(channelID, notes.join('\n'), userID);
                break;
            case 'edit':
                // Note field changes
                break;
            case 'cast':
                // Format all pretty like
                break;
        }
    }
}

function write_spell(spell, user, server) {
    if (!Spells[server])
        Spells[server] = {};
    if (!Spells[server][user])
        Spells[server][user] = [];
    Spells[server][user].push(spell);

    fs.writeFile('Spells.json', JSON.stringify(Spells),
     (err) => {
        if (err) throw err;
     });
}