const Spells = require('./Spells.json')
const fs = require('fs');

exports.command = function(userID, channelID, serverID, message, sender) {
    const Common = require('../Common.js');

    if (message.match(/^\/spell /i)) {
        let argList = Common.args(message);
        let knownParams = ['arts', 'range', 'duration', 'target', 'level', 'description'];
        let userSpells = (Spells[serverID] && Spells[serverID][userID]) || {};
        let notes = [];

        switch (argList[0]) {
            case 'create':
                if (!('name' in argList))
                    return sender(channelID, 'The spell needs a name', userID);

                if (userSpells[argList['name']])
                    return sender(channelID, `The spell **${argList['name']}** already exists`, userID);

                let spell = {
                    arts: 'creo animal',
                    range: 'personal',
                    duration: 'momentary',
                    target: 'individual',
                    level: 1,
                    description: 'magic'
                };

                for (let param in argList) {
                    if (knownParams.includes(param))
                        spell[param] = argList[param];
                }

                for (let i in knownParams)
                    if (!(knownParams[i] in argList))
                        notes.push(`Property **${knownParams[i]}** was missing, defaulted to **${spell[knownParams[i]]}**`);
                
                write_spell(argList['name'], spell, userID, serverID)

                notes.push(`Spell **${argList['name']}** saved.`);
                break;
            case 'edit':
                // Note field changes
                if (!argList[1])
                    return sender(channelID, `No spell name supplied for editing`, userID);

                    let editSpell;
                    for (spell in userSpells)
                        if (argList[1].toLowerCase() === spell.toLowerCase())
                            editSpell = userSpells[spell];

                if (!editSpell)
                    return sender(channelID, `The spell **${argList['name']}** doesn't exist`, userID);

                if ('name' in argList)
                    if (userSpells[argList['name']])
                        return sender(channelID, `The spell **${argList['name']}** already exists`, userID);
                    else {
                        notes.push(`Property **name** was changed from **${argList[1]}** to **${argList['name']}**`);
                        write_spell(argList['name'], editSpell, userID, serverID);
                        remove_spell(argList[1], userID, serverID);
                        editSpell = userSpells[argList['name']];
                    }

                for (let i in editSpell)
                    if (i in argList){
                        notes.push(`Property **${i}** was changed from **${editSpell[i]}** to **${argList[i]}**`)
                        editSpell[i] = argList[i];
                    }

                write_spell(argList['name'] || argList[1], editSpell, userID, serverID);

                notes.push(`Spell **${argList['name'] || argList[1]}** saved.`);
                break;
            case 'cast':
                if (!argList[1])
                    return sender(channelID, `No spell name supplied for casting`, userID);

                let casting;
                for (spell in userSpells)
                    if (argList[1].toLowerCase() === spell.toLowerCase())
                        casting = userSpells[spell];


                if (!casting)
                    return sender(channelID, `No spell found with name ${argList[1]}`)

                notes.push(`**${argList[1]}** (Level ${casting.level})`); //name, level
                notes.push(`*${casting.arts}*`); //arts
                notes.push(`Range: ${casting.range}, Duration: ${casting.duration}, Target: ${casting.target}`); //ran, dur, tar
                notes.push(`\`\`\`${casting.description}\`\`\``); //desc
                
                break;
        }

        sender(channelID, notes.join('\n'), userID);
    }
}

function write_spell(name, spell, user, server) {
    if (!Spells[server])
        Spells[server] = {};
    if (!Spells[server][user])
        Spells[server][user] = {};
    Spells[server][user][name] = spell;

    fs.writeFileSync('plugins/Spells.json', JSON.stringify(Spells));
}

function remove_spell(name, user, server) {
    if (Spells[server] && Spells[server][user] && Spells[server][user][name])
        delete Spells[server][user][name];

    fs.writeFileSync('plugins/Spells.json', JSON.stringify(Spells));
}