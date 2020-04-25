let skills_master = require('./skills.json');
const r = {};

class Skill {

    constructor(message) {
        let parsed = this.parseMessage(message);
        let skill_raw = skills_master[parsed.name];

        if (skill_raw) {
            this.name = parsed.name;
            this.description = JSON.parse(JSON.stringify(skill_raw.description));
            this.dice = JSON.parse(JSON.stringify(skill_raw.dice));
            this.actions = JSON.parse(JSON.stringify(skill_raw.actions));
            this.parameters = JSON.parse(JSON.stringify(skill_raw.parameters || []));

            this.arg_dict = this.zipParams(parsed.args);
            this.static_dice = this.initialRoll();

            this.subParamsAndStaticDice();
        }
    }

    use() {
        let full_output = "";
        for (let action = 0; action < this.actions.length; action++) {
            let current_action = this.actions[action];
            this.actionDefaults(current_action);
            let output = current_action.preamble;
            let locals = {}

            for (let repeat = 0; repeat < current_action.repeat; repeat++) {
                locals.repeat = repeat;
                if (current_action.result.includes('{r'))
                    output += '`' + (r.roll(this.subLocalsAndDice(current_action.result, locals)).output) + "`";
                else
                    output += '`' + this.subLocalsAndDice(current_action.result, locals) + '`';
            }
            full_output += output + current_action.epilogue;
        }

        return full_output;
    }

    actionDefaults(action) {
        action.repeat = action.repeat ? action.repeat : 1;
        action.preamble = action.preamble ? action.preamble : "";
        action.epilogue = action.epilogue ? action.epilogue : "";
    }

    subLocalsAndDice(text, locals) {
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '{') {
                let end = text.indexOf('}', i);
                if (text[i+1] === 'r') {
                    let index = parseInt(text.slice(i+2, end));
                    let die = this.dice[index];
                    text = text.replace(new RegExp('\{r'+index+'\}', 'g'), die);
                } else if (text[i+1] === 'l') {
                    let name = text.slice(i+2, end);
                    let value = locals[name];
                    text = text.replace(new RegExp('\{l'+name+'\}', 'g'), value);
                }
            }
        }
        return text;
    }

    subParamsAndStaticDice() {
        let self = this;
        this.actions.forEach(function (action) {
            for (let prop in action) {
                action[prop] = self.subParams(action[prop]);
                action[prop] = self.subStaticDice(action[prop]);
            }
        });
    }

    subParams(text) {
        for (let i = 0; i < text.length; i++)
            if (text[i] === '<') {
                let end = text.indexOf('>', i);
                let param = text.slice(i+1, end);
                let value = this.arg_dict[param];
                text = text.replace(new RegExp('\<'+param+'\>', 'g'), value);
            }
        return text;
    }

    subStaticDice(text) {
        for (let i = 0; i < text.length; i++)
            if (text[i] === '{' && text[i+1] === 's') {
                let end = text.indexOf('}', i);
                let index = parseInt(text.slice(i+2, end));
                let value = this.static_dice[index];
                text = text.replace(new RegExp('\{s'+index+'\}', 'g'), value);
            }
        return text;
    }

    parseMessage(message) {
        let parsed = {};
        this.valid = false;
        if (message[0] === '[') {
            let end = message.indexOf(']')
            if (end > 0) {
                let name = message.slice(1, end);
                if (skills_master[name]) {
                    parsed.name = name;
                    let args = message.slice(end+1);
                    let split_args = args.split(' ').filter(function (sub) {return sub != ''});
                    parsed.args = split_args;
                    this.valid = true;
                }
            }
        }

        return parsed;
    }

    zipParams(args) {
        let arg_dict = {}

        if (this.parameters.length !== args.length)
            this.valid = false;
        else
            for (let i = 0; i < args.length; i++) {
                arg_dict[this.parameters[i]] = args[i];
            }

        return arg_dict;
    }

    initialRoll() {
        let rolled_dice = [];
        let self = this;
        this.dice.forEach(function (die) {
            rolled_dice.push(r.roll(die).output);
        });
        return rolled_dice;
    }

    parseRoll(str) {
        let temp = str.split('d');
        let number = parseInt(temp[0]);
        let die = parseInt(temp[1]);
        return this.roll(number, die);
    }

    roll(n, d) {
        let total = 0;
        for (let i = 0; i < n; i++)
            total += Math.floor(Math.random() * (d-1) + 1);

        return total;
    }

    format(str, form) {
        let cpy = str;
        for (let i = 0; i < form.length; i++) {
            let regex = new RegExp(`\\\{${i}\\\}`, "g");
            cpy = cpy.replace(regex, parseRoll(form[i]));
        }
        return cpy;
    }

}

module.exports = Skill;
