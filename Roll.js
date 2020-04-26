let r_die = /d\d*/i;
let r_count = /\d*d/i;
let r_mod = /[+-]\d*/g;
let r_mod_only = /^\d+($|[+b!-])/;
let r_keep = /k\d*/i;
let r_keep_low = /kl\d*/i;
let r_explode = /!/;
let r_brief = /b/;
let r_conditional = /[><=]=?\d+/;

class Roll {
    constructor(text, s_config, d_config) {
        let dice_config = s_config && s_config.default && s_config.default.dice;
        this.text = text;
        this.die = parseInt(dice_config && dice_config.value || d_config.default.dice.value);
        this.count = parseInt(dice_config && dice_config.count || d_config.default.dice.count);
        this.mod = 0;
        this.keep = parseInt(dice_config && dice_config.keep || d_config.default.dice.keep);
        this.explode = false;
        this.brief = false;
        this.conditional = {active: false, '<': NaN, '=': NaN, '>': NaN};
        this.roll_list = [];
        this.mods_list = [];
        this.kept_list = [];
        this.calc();
    }

    calc() {
        let form = this.text;

        let m_die = form.match(r_die);
        if (m_die && m_die[0].slice(1))
            this.die = parseInt(m_die[0].slice(1));

        let m_count =  form.match(r_count);
        if (m_count && m_count[0].slice(0, -1))
            this.count = parseInt(m_count[0].slice(0, -1));

        let m_mod = form.match(r_mod);
        if (m_mod && m_mod.length)
            for (let i in m_mod)
                this.mod += parseInt(m_mod[i])

        let m_mod_only = form.match(r_mod_only);
        if (m_mod_only)
            this.mod += parseInt(m_mod_only[0])

        let m_keep = form.match(r_keep);
        if (m_keep && m_keep[0].slice(1))
            this.keep = parseInt(m_keep[0].slice(1));

        let m_keep_low = form.match(r_keep_low);
        if (m_keep_low && m_keep_low[0].slice(2))
            this.keep = parseInt(m_keep_low[0].slice(2)) * -1;

        let m_explode = form.match(r_explode);
        if (m_explode)
            this.explode = true;

        let m_brief = form.match(r_brief);
        if (m_brief)
            this.brief = true;

        let m_conditional = form.match(r_conditional);
        if (m_conditional) {
            let n = parseInt(m_conditional[0].match(/\d+/)[0]);
            this.conditional.active = true;
            this.conditional[m_conditional[0][0]] = n;
            this.conditional[m_conditional[0][1]] = n;
        }

        console.log('count:', this.count, 'die:', this.die, 'mod:', this.mod, 'keep:', this.keep, 'explode:', this.explode, 'brief:', this.brief);
        this.roll();
    }

    roll(arbitrary_mod = 0) {
        this.roll_list = [];
        this.mods_list = [];
        this.kept_list = [];

        let total = 0;
        let explode_count = 0;
        for (let i = 0; i < this.count; i++) {
            let r = Math.floor(Math.random() * (this.die) + 1);
            if (this.explode && r === this.die) {
                explode_count++;
                i--;
            } else {
                this.roll_list.push(r + this.die*explode_count);
                if (!this.keep && !this.conditional.active)
                    total += r + this.die*explode_count;
            }
        }

        let sorted_rolls = this.roll_list.map((r, i) => {return {i, r}});
        sorted_rolls.sort((a, b) => b.r-a.r);

        if (this.keep) {
            for (let i = 0; this.keep > 0 && i < this.keep; i++)
                this.kept_list.push(sorted_rolls[i].i);
            for (let i = sorted_rolls.length-1; this.keep < 0 && i >= sorted_rolls.length + this.keep; i--)
                this.kept_list.push(sorted_rolls[i].i);

            for (let i in this.kept_list)
                total += this.roll_list[this.kept_list[i]];
        }

        if (this.conditional.active) {
            for (let i = 0; i < sorted_rolls.length; i++) {
                let r = sorted_rolls[i].r;
                if (r < this.conditional['<']
                 || r === this.conditional['=']
                 || r > this.conditional['>']) {
                    this.kept_list.push(sorted_rolls[i].i)
                    total += 1;
                 }
            }
        }

        if (this.mod) { 
            this.mods_list.push(this.mod + arbitrary_mod);
        } else {
            this.mods_list.push(arbitrary_mod);
        }
        total += this.mod + arbitrary_mod;
        
        this.result = total;
        return this;
    }

    output() {
        let output = ''
        if (!this.brief) {
            output += '(';
            for (let i in this.roll_list) {
                if (i > 0)
                    output += this.conditional.active ? ',' : '+';
                if ((this.keep || this.conditional.active) && !this.kept_list.includes(parseInt(i)))
                    output += '~~' + this.roll_list[i] + '~~';
                else if (this.roll_list[i] === this.die)
                    output += '**' + this.roll_list[i] + '**';
                else
                    output += this.roll_list[i];
            }
            output += ')';

            for (let i in this.mods_list) {
                if (this.mods_list[i]) {
                    if (this.mods_list[i] > 0)
                        output += '+';
                    output += this.mods_list[i];
                }
            }

            output += '='
        }

        output += '**' + this.result + '**';
        return output;
    }

}

module.exports = Roll;