const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whatarefactions')
        .setDescription('Explains what factions are in Starbase.'),

    async execute(interaction) {
        interaction.reply('Factions..? Those times are long gone, the times of suffering, dispair and carnage, I was there for the purge and I saw it all...')
    }
}