let r_die = /d\d*/i;
let r_count = /\d*d/i;
let r_mod = /[+-]\d*/g;
let r_mod_only = /^\d+($|[+-b!])/;
let r_keep = /k\d*/i;
let r_keep_low = /kl\d*/i;
let r_explode = /!/;
let r_brief = /b/;

class Roll {
    constructor(text) {
        this.text = text;
        this.die = 100;
        this.count = 1;
        this.mod = 0;
        this.keep = 0;
        this.explode = false;
        this.brief = false;
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
                if (!this.keep)
                    total += r + this.die*explode_count;
            }
        }

        if (this.keep) {
            let sorted_rolls = this.roll_list.map((r, i) => {return {i, r}});
            sorted_rolls.sort((a, b) => b.r-a.r);
            for (let i = 0; this.keep > 0 && i < this.keep; i++)
                this.kept_list.push(sorted_rolls[i].i);
            for (let i = sorted_rolls.length-1; this.keep < 0 && i >= sorted_rolls.length + this.keep; i--)
                this.kept_list.push(sorted_rolls[i].i);

            for (let i in this.kept_list)
                total += this.roll_list[this.kept_list[i]];
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
                    output += '+';
                if (this.keep && !this.kept_list.includes(parseInt(i)))
                    output += '~~' + this.roll_list[i] + '~~';
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