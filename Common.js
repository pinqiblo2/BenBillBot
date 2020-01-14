/*exports.args = function(command) {
    parsedArgs = [];
    currentArg = 0;
    inCommand = true;
    inQuotes = false;
    for (let i = 0; i < command.length; i++) {
        if (!inCommand) {
            if (command[i] === ' ' && !inQuotes)
                currentArg++;
            else if (command[i] === '"')
                inQuotes = !inQuotes;
            else
                parsedArgs[currentArg] = 
                    parsedArgs[currentArg] ? 
                        parsedArgs[currentArg] + command[i]
                        : command[i];
        } else if (command[i] === ' ')
            inCommand = false;
    }
    return parsedArgs
}*/

exports.args = function(command) {
    let unparsedArgs = command.slice(command.indexOf(' ')+1);
    let anonymousParam = 0;
    let param = "";
    let anonymousArg = true;
    let sliced = unparsedArgs;
    let argDict = {};

    while (sliced.length > 0) {

        let m_QuoteArg = sliced.match(/^"[^"]*"($| )/i);
        let m_StandardArg = sliced.match(/^[a-z0-9]+($| )/i);
        let m_Parameter = sliced.match(/^[a-z0-9]+: ?/i);
        let localArg = "";
        let skipLen = 0;

        if (m_QuoteArg) {
            localArg = m_QuoteArg[0].trim().slice(1, -1);
            skipLen = m_QuoteArg[0].length;
        } else if (m_StandardArg) {
            localArg = m_StandardArg[0].trim();
            skipLen = m_StandardArg[0].length;
        } else if (m_Parameter) {
            anonymousArg = false;
            param = m_Parameter[0].toLowerCase().trim().slice(0, -1);
            skipLen = m_Parameter[0].length;
        }

        if (m_StandardArg || m_QuoteArg) {
            if (anonymousArg) {
                argDict[anonymousParam] = localArg;
            } else {
                argDict[param] = localArg;
                anonymousArg = true;
            }
        }
    
        sliced = sliced.slice(skipLen);
    }

    return argDict;
}