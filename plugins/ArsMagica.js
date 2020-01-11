exports.command = function(userID, channelID, message, sender) {
    if (message.match(/^\/test$/i)) {
        sender(channelID, "Ars Magica", userID);
    }
}