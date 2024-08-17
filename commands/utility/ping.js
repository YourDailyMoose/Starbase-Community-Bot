const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong! and latency data'),
    async execute(interaction) {
        const start = Date.now();
        await interaction.reply(`Pong! Latency is ${Date.now() - start}ms.`);
    },
};